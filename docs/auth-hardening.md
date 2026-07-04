# Auth Hardening Review

**Date:** 2026-07-03
**Scope:** Admin JWT, Customer JWT, session storage, revocation, token lifetime

---

## Current state

### Admin auth

| Property | Value |
|---|---|
| Token type | JWT (HS256, shared `JWT_SECRET`) |
| Token TTL | 7 days (env `JWT_EXPIRES_IN`, default `7d`) |
| Storage | `localStorage` (`admin_token`) |
| Session table | None |
| Revocation | Not possible — no server-side record |
| Logout | Removes token from `localStorage` only |

### Customer auth

| Property | Value |
|---|---|
| Token type | JWT (HS256, same `JWT_SECRET` as admin) |
| Token TTL | 30 days (hardcoded `SESSION_TTL_DAYS = 30`) |
| Storage | `localStorage` (`customer_token`) |
| Session table | `CustomerSession` in Postgres |
| Revocation | Partial — `CustomerSession.isActive` is set to `false` on logout via `x-session-token` header, but the JWT itself remains cryptographically valid until expiry |
| Logout | Marks DB session inactive + removes token from `localStorage` |

### Shared secret

Both admin and customer tokens are signed with the same `config.jwt.secret`. A valid customer token would pass `jwt.verify` in admin middleware unless the role claim check (`decoded.role !== 'ADMIN'`) catches it. The middleware does check the role, so there is no privilege escalation in practice — but a single compromised secret invalidates all tokens for both audiences.

---

## Issues by severity

### High — admin tokens cannot be revoked

If an admin token is stolen (XSS, shared machine, leaked log) there is no way to invalidate it before its 7-day expiry. `CustomerSession` gives customers meaningful revocation; admins have nothing equivalent.

**Fix:** Add an `AdminSession` table mirroring `CustomerSession`, check `isActive` on every admin request, set it `false` on logout.

### Medium — long-lived tokens in localStorage

`localStorage` is accessible to any JavaScript running on the page, making tokens vulnerable to XSS. Both tokens have long TTLs (7d admin, 30d customer) that maximise the damage window.

**httpOnly cookies vs localStorage — tradeoff for this architecture:**

This project runs three separate apps on three subdomains (`public.localhost`, `admin.localhost`, `customer.localhost`). httpOnly cookies scoped to a single subdomain do not cross to other subdomains, which is actually fine here — each app only needs its own token. The concern is CORS and `SameSite`:

- In production with real subdomains (e.g. `admin.yourdomain.com`) sharing a parent domain, cookies scoped to `.yourdomain.com` would work naturally.
- In local dev with `*.localhost` subdomains and the `dev-proxy`, `SameSite=Lax` cookies work fine since requests stay within the same registrable domain (`localhost`).
- The API (`api.localhost`) is a different subdomain — the cookie would need `domain=.localhost` and `SameSite=Lax` or `SameSite=None; Secure`.

**Verdict:** httpOnly cookies are achievable here. The subdomain setup is not a blocker — it requires setting `domain` on the cookie, which is a small config change. The payoff is eliminating the XSS token theft vector entirely.

### Medium — customer JWT TTL is 30 days but isn't configurable

`SESSION_TTL_DAYS = 30` is a hardcoded constant in `customer.service.ts`. This should at minimum be an env var so it can be tightened in production without a code deploy.

### Low — same JWT secret for both audiences

Using separate secrets for admin and customer tokens would mean a compromised customer-side secret could not be used to forge admin tokens, and vice versa. Minor given role checks are in place, but adds defence-in-depth.

### Low — no access token / refresh token split

Currently a single long-lived JWT is issued at login. A short-lived access token (15–60 min) + long-lived refresh token pattern would limit the blast radius of a stolen access token. The `CustomerSession` table already provides the infrastructure for a refresh token on the customer side. Admin has no equivalent.

---

## Recommendations

Listed in priority order. Each is independent and can be done in isolation.

### 1. Add `AdminSession` table and check on every admin request (High, Small effort)

Mirror `CustomerSession` exactly. On admin login, create a session row. On every `authenticate()` call, verify `isActive = true` and `expiresAt > now()` against the DB. On logout, set `isActive = false`. This closes the revocation gap.

Caveat: this adds one DB read to every admin API call. Mitigate with a short cache (`cacheGet`/`cacheSet` on the session token, 5-minute TTL) — the pattern is already used everywhere in the codebase.

### 2. Shorten token TTLs

- Admin JWT: 7d → 1d (matches a working session without a refresh mechanism)
- Customer JWT: 30d → 7d, or keep 30d but move to refresh tokens (see #4)

`JWT_EXPIRES_IN` is already an env var for admin. `SESSION_TTL_DAYS` in `customer.service.ts` should be extracted to `config` likewise.

### 3. Switch to httpOnly cookies (Medium, Medium effort)

Replace `localStorage` with `httpOnly; SameSite=Lax; Secure` cookies. Server sets the cookie on login response; client JS never touches the token. Required changes:

- `server`: `res.cookie(...)` on login/OAuth callback, `res.clearCookie(...)` on logout, read from `req.cookies` instead of `Authorization` header in middleware.
- `server`: Add `cookie-parser` middleware, set `credentials: true` on CORS config with explicit `origin` allowlist.
- `apps/admin` + `apps/customer`: Remove all `localStorage` token reads/writes from `AuthContext`. All API calls include cookies automatically — no `Authorization` header needed.
- Dev proxy: pass `Cookie` header through (it already does, no change needed).

This is the single highest-leverage security change. It eliminates the entire XSS-to-token-theft attack path.

### 4. Separate JWT secrets per audience (Low, Tiny effort)

Add `ADMIN_JWT_SECRET` and `CUSTOMER_JWT_SECRET` env vars. Default to the existing `JWT_SECRET` if not set, so it's backwards-compatible with existing deployments. Update `signJwt` and middleware to use the appropriate secret.

### 5. Access token + refresh token (Low, Hard effort)

Only worth doing after #3 (cookies) since refresh tokens stored in `localStorage` have the same XSS problem as the current tokens. With httpOnly cookies:

- Issue a short-lived (15 min) access token + a long-lived (30d) refresh token, both as separate httpOnly cookies.
- Add `POST /customer/auth/refresh` and `POST /auth/refresh` endpoints that validate the refresh token against `CustomerSession` / `AdminSession` and issue a new access token.
- `CustomerSession.token` already plays the role of a refresh token — it just needs an endpoint that uses it.

**Not recommended right now** — the complexity cost is high and items #1–#3 close the most dangerous gaps first.

---

## Suggested implementation order

1. **`AdminSession` table + revocation check** (#1) — closes the highest-severity gap, no frontend changes needed
2. **Shorten TTLs + extract `SESSION_TTL_DAYS` to config** (#2) — two-line change, deploy independently
3. **httpOnly cookies** (#3) — biggest effort but biggest security gain, do as one focused PR
4. **Separate JWT secrets** (#4) — trivially add after #3
5. **Refresh tokens** (#5) — only if session TTLs from #2 become operationally painful

---

## What NOT to do

- Do not add refresh tokens before httpOnly cookies — it doesn't help if the token is still in `localStorage`.
- Do not change the subdomain routing for cookie support — it works as-is with the right cookie `domain` setting.
- Do not implement all of this at once — the items are independent and are safer shipped one at a time.
