# OAuth Setup Guide — Google & GitHub

OAuth login allows customers to sign in using their existing Google or GitHub accounts. No password required.

## How It Works

```
Customer clicks "Continue with Google"
        │
        │  window.location.href → /api/customer/auth/google
        ▼
Server generates CSRF state token, redirects to Google consent page
        │
        │  Google redirects back to:
        │  /api/customer/auth/google/callback?code=...&state=...
        ▼
Server:
  1. Validates CSRF state
  2. Exchanges code for access token
  3. Fetches user profile (email, name, avatar) from Google
  4. Looks up customer by (provider + providerId)
     → If found: logs them in
     → If email matches existing account: links provider, logs in
     → If new user: creates account
  5. Creates JWT + session
  6. Redirects browser to:
     customer.localhost:5173/auth/callback?token=<jwt>&session=<sessionToken>
        │
        ▼
OAuthCallback.tsx:
  - Stores JWT in localStorage
  - Fetches customer profile (/api/customer/auth/me)
  - Calls signIn() → navigates to /dashboard
```

---

## Step 1 — Google OAuth Setup

### Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project → New Project**
3. Name it (e.g. "Portfolio Platform") and click **Create**

### Enable the OAuth API

1. In the left sidebar: **APIs & Services → Library**
2. Search for **"Google+ API"** or **"Google Identity"** and enable it
3. Also enable **"People API"** if prompted

### Create OAuth Credentials

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. If prompted, configure the **OAuth consent screen** first:
   - User type: **External**
   - App name: your portfolio name
   - Support email: your email
   - Authorized domains: `localhost` (for dev) and your production domain
   - Scopes: add `email`, `profile`, `openid`
   - Save and continue
4. Back in **Create OAuth client ID**:
   - Application type: **Web application**
   - Name: "Portfolio Customer Portal"
   - **Authorised JavaScript origins:**
     ```
     http://customer.localhost:5173
     http://localhost:5173
     ```
   - **Authorised redirect URIs:**
     ```
     http://api.localhost:5173/api/customer/auth/google/callback
     ```
     For production, also add:
     ```
     https://api.yourdomain.com/api/customer/auth/google/callback
     ```
5. Click **Create** — copy the **Client ID** and **Client Secret**

### Add to `.env`

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
GOOGLE_CALLBACK_URL=http://api.localhost:5173/api/customer/auth/google/callback
```

---

## Step 2 — GitHub OAuth Setup

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** Portfolio Customer Portal
   - **Homepage URL:** `http://customer.localhost:5173`
   - **Authorization callback URL:**
     ```
     http://api.localhost:5173/api/customer/auth/github/callback
     ```
4. Click **Register application**
5. On the next page, copy the **Client ID**
6. Click **Generate a new client secret** and copy it

### Add to `.env`

```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://api.localhost:5173/api/customer/auth/github/callback
```

### GitHub Email Note

GitHub accounts where the email is set to **private** will not expose the email in the profile API. The server falls back to the `/user/emails` API endpoint to find the primary verified email. Ask users to ensure at least one verified email exists on their GitHub account.

---

## Step 3 — Configure Redirect URLs

Add these to your `.env`:

```env
# Where the browser goes after successful OAuth
OAUTH_SUCCESS_URL=http://customer.localhost:5173/auth/callback

# Where the browser goes if OAuth fails
OAUTH_ERROR_URL=http://customer.localhost:5173/login
```

---

## Step 4 — Full `.env` for Local OAuth Development

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_CALLBACK_URL=http://api.localhost:5173/api/customer/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-id
GITHUB_CLIENT_SECRET=your-github-secret
GITHUB_CALLBACK_URL=http://api.localhost:5173/api/customer/auth/github/callback

# OAuth redirect targets
OAUTH_SUCCESS_URL=http://customer.localhost:5173/auth/callback
OAUTH_ERROR_URL=http://customer.localhost:5173/login
```

---

## Step 5 — Run Locally with OAuth

```bash
# Install dependencies (if not already done)
npm run install:all

# Start everything
npm run dev
```

With the dev proxy running on port 5173:
- Customer portal: `http://customer.localhost:5173`
- OAuth callback hits: `http://api.localhost:5173/api/customer/auth/google/callback`
- The dev proxy routes `api.localhost:5173` → Express on `:5000`

**Important:** `*.localhost` resolves to `127.0.0.1` natively in all modern browsers. No `/etc/hosts` changes needed.

---

## Production Setup

For production deployments, update callback URLs in both the provider settings **and** `.env`:

```env
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/customer/auth/google/callback
GITHUB_CALLBACK_URL=https://api.yourdomain.com/api/customer/auth/github/callback
OAUTH_SUCCESS_URL=https://customer.yourdomain.com/auth/callback
OAUTH_ERROR_URL=https://customer.yourdomain.com/login
```

In Google Cloud Console: add the production callback to **Authorised redirect URIs**.
In GitHub Developer Settings: update the **Authorization callback URL**.

---

## Account Linking Rules

| Scenario | Behaviour |
|---|---|
| First time signing in with Google | New customer account created |
| First time signing in with GitHub | New customer account created |
| OAuth email matches existing email/password account | Provider linked to existing account, user logged in |
| Same Google account used again | Existing account found by `providerId`, user logged in |
| Same GitHub account used again | Existing account found by `providerId`, user logged in |

No duplicate accounts are created — if an email already exists, the OAuth provider is linked to it.

---

## Without OAuth Keys

If `GOOGLE_CLIENT_ID` or `GITHUB_CLIENT_ID` are not set, clicking the OAuth button returns an error response explaining the provider is not configured. Email/password login continues to work normally.

---

## File Reference

| File | Purpose |
|---|---|
| `server/src/controllers/oauth.controller.ts` | OAuth initiation and callback handlers |
| `server/src/services/customer.service.ts` | `oauthLogin()` — find/create/link customer |
| `server/src/config/index.ts` | OAuth config (client IDs, secrets, callback URLs) |
| `server/src/routes/index.ts` | Routes: `GET /customer/auth/google`, `/callback`, etc. |
| `apps/customer/src/components/auth/OAuthButtons.tsx` | Reusable Google + GitHub button component |
| `apps/customer/src/pages/customer/Login.tsx` | Login page with OAuth buttons |
| `apps/customer/src/pages/customer/Register.tsx` | Register page with OAuth buttons |
| `apps/customer/src/pages/customer/OAuthCallback.tsx` | Handles redirect back from server, stores token |
