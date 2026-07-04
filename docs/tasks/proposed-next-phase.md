# Proposed Next Phase

A menu of concrete, independently-buildable tasks for the next phase of the platform. This is a proposal, not a commitment — nothing here has been started. Pick whichever task(s) you want done and say so; each is scoped to be built and shipped on its own.

AI-dependent work (inquiry triage, content assistant, analytics summaries, support assistant upgrade — all covered in `upcoming.md`) is intentionally excluded here: no `OPENAI_API_KEY` is configured, so those aren't buildable right now. This file only covers stabilization work that needs no external API key.

This complements (does not replace) `upcoming.md` and `planned.md` — pull from those once an API key is available.

---

## Stabilization tasks

No CI exists at all right now (no `.github/workflows`), and only `apps/admin` has a real test suite — `apps/public` and `apps/customer`'s `npm test` just runs a build. Three consecutive infrastructure-level changes (TanStack Query, Redis/BullMQ, CRM pipeline) shipped in one day with nothing gating a regression.

### 1. CI pipeline
**Effort:** Small

- GitHub Actions workflow: on PR/push to `main`, run `tsc --noEmit` in `server`, `npm test` in `server` and `apps/admin`, and `npm run build` in all three apps
- Fail the check on any error — this is the cheapest insurance available given current velocity

### 2. Test coverage for `apps/public` and `apps/customer`
**Effort:** Medium

- Wire up Vitest + Testing Library in both apps (mirror `apps/admin`'s existing `vitest.config.ts` and `src/tests/setup.ts`)
- Cover at minimum: customer auth flow (login/register/OAuth callback), checkout initiation, and one or two public content pages
- Replace the current placeholder `"test": "npm run build"` scripts with real ones

### 3. Auth hardening review
**Effort:** Medium

- Current model: JWT for both admin and customer persisted in `localStorage`, no refresh rotation, no revocation list for admin tokens (customer sessions are tracked via `CustomerSession`, admin tokens are not)
- Evaluate: httpOnly cookie storage vs. localStorage, short-lived access token + refresh token pattern, admin session tracking to match what customers already have
- Deliverable is a short findings + recommendation writeup before any code changes — this one has real tradeoffs (cookie storage complicates the subdomain-per-app setup) and shouldn't be done blind

### 4. Multi-admin roles
**Effort:** Hard — same as `planned.md` #16, listed here because it pairs naturally with #3

- Add an `EDITOR` role that can manage content but not payments/customers/settings
- Only worth doing once #3's auth model is settled, since it touches the same middleware

### 5. Global admin search
**Effort:** Small — same as `planned.md` #2, no AI involved

- New endpoint: `GET /api/admin/search?q=...` across customers, inquiries, blog posts, projects, services, testimonials
- `Cmd+K` command-bar modal in the admin shell, grouped results by type

### 6. CSV / data export
**Effort:** Small — same as `planned.md` #4

- `GET /api/admin/export/inquiries.csv`, `.../payments.csv`, `.../customers.csv`
- Export button in each admin list view

---

## Suggested order if picking more than one

1. CI (#1) — cheapest, protects everything after it
2. Frontend test coverage (#2)
3. Global admin search (#5) or CSV export (#6) — quick, high-utility wins
4. Auth review (#3) → multi-admin roles (#4) — only if you want to go there

---

## How to use this file

Tell me which task number(s) you want done, and I'll implement them. Once a task is done, its entry should move to `docs/tasks/completed.md` following the existing format in that file.
