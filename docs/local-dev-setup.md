# Local Development Setup

## Overview

All three frontend applications and the API server run through a **single port (`5173`)** during development. A lightweight proxy reads the subdomain from each request's `Host` header and routes it to the correct internal server.

```
Browser                   Dev Proxy (:5173)        Internal servers
───────────────────────   ──────────────────────   ────────────────
public.localhost:5173  ──▶  subdomain = "public"  ──▶  Vite :3000
admin.localhost:5173   ──▶  subdomain = "admin"   ──▶  Vite :3001
customer.localhost:5173──▶  subdomain = "customer"──▶  Vite :3002
api.localhost:5173     ──▶  subdomain = "api"     ──▶  Express :5000
localhost:5173         ──▶  (default)             ──▶  Vite :3000
```

The internal servers (`:3000`, `:3001`, `:3002`, `:5000`) are bound to `127.0.0.1` and are not directly accessible — all traffic flows through the proxy.

---

## Why `*.localhost` works without `/etc/hosts`

Modern browsers and operating systems resolve `*.localhost` to `127.0.0.1` automatically per [RFC 6761](https://datatracker.ietf.org/doc/html/rfc6761). No DNS configuration or `/etc/hosts` edits are needed on:

- Chrome / Chromium (any version)
- Firefox 80+
- Safari / WebKit
- macOS, Linux, Windows 10+

---

## Quick Start

### 1. Install all dependencies

```bash
git clone https://github.com/your-username/portfolio-v3.git
cd portfolio-v3
npm run install:all
```

This installs root tools (`concurrently`), server packages, all three app packages, and the dev proxy package in one command.

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
DATABASE_URL=postgresql://portfolio:changeme@localhost:5432/portfolio
JWT_SECRET=your-long-random-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Set up the database

```bash
npm run db:setup
```

Creates all tables, indexes, and seeds demo data including the default admin account.

### 4. Start the platform

```bash
npm run dev
```

All five processes start in parallel:

| Process | Label | Role |
|---------|-------|------|
| `node dev-proxy/index.js` | `proxy` | Subdomain router on `:5173` |
| `server` (tsx watch) | `api` | Express API on `127.0.0.1:5000` |
| `apps/public` (vite) | `public` | React app on `127.0.0.1:3000` |
| `apps/admin` (vite) | `admin` | React app on `127.0.0.1:3001` |
| `apps/customer` (vite) | `customer` | React app on `127.0.0.1:3002` |

Terminal output is colour-coded by process name.

### 5. Open in browser

| URL | Application |
|-----|-------------|
| http://public.localhost:5173 | Public portfolio site |
| http://admin.localhost:5173 | Admin dashboard |
| http://admin.localhost:5173/login | Admin login |
| http://customer.localhost:5173 | Customer portal |
| http://customer.localhost:5173/login | Customer login / register |
| http://api.localhost:5173/health | API health check |

**Default admin credentials:** `admin@portfolio.dev` / `Admin@123456`

---

## How the proxy works

The proxy lives in `dev-proxy/index.js` and uses `http-proxy` to forward HTTP and WebSocket (Vite HMR) connections.

```js
// Routing table in dev-proxy/index.js
const ROUTES = {
  public:   'http://127.0.0.1:3000',
  admin:    'http://127.0.0.1:3001',
  customer: 'http://127.0.0.1:3002',
  api:      'http://127.0.0.1:5000',
};
```

When a request arrives, the proxy parses the hostname:

```
"admin.localhost:5173"  →  subdomain = "admin"  →  target = :3001
"public.localhost:5173" →  subdomain = "public" →  target = :3000
"localhost:5173"        →  subdomain = null     →  target = :3000 (default)
```

WebSocket connections (used by Vite's Hot Module Replacement) are forwarded too, so live reloading works normally across all three apps.

---

## API calls in apps

All three apps use a **relative `/api` base URL**. Each app's Vite config proxies `/api` → `127.0.0.1:5000`:

```ts
// Each app's vite.config.ts
proxy: {
  '/api':     { target: 'http://127.0.0.1:5000', changeOrigin: true },
  '/uploads': { target: 'http://127.0.0.1:5000', changeOrigin: true },
}
```

This means API calls work the same whether the request comes through the proxy (`public.localhost:5173/api/...`) or directly (`localhost:3000/api/...`).

---

## Individual app commands

If you need to run apps separately (e.g. for debugging a single app):

```bash
npm run dev:proxy     # proxy only (port 5173)
npm run dev:api       # Express server only
npm run dev:public    # public site only (port 3000)
npm run dev:admin     # admin dashboard only (port 3001)
npm run dev:customer  # customer portal only (port 3002)
```

---

## Stripe webhook in development

Point the Stripe CLI at the proxy port:

```bash
stripe listen --forward-to http://api.localhost:5173/api/payments/webhook
```

Or directly to the API port:

```bash
stripe listen --forward-to http://localhost:5000/api/payments/webhook
```

---

## Troubleshooting

**`public.localhost:5173` shows "502 — Dev server not ready"**
The proxy is running but the Vite app hasn't started yet. Wait a few seconds and reload. All five processes need to be ready.

**Port already in use**

| Process | Port | Change in |
|---------|------|-----------|
| Proxy | 5173 | `dev-proxy/index.js` → `PROXY_PORT` |
| Public app | 3000 | `apps/public/vite.config.ts` + `package.json` |
| Admin app | 3001 | `apps/admin/vite.config.ts` + `package.json` |
| Customer app | 3002 | `apps/customer/vite.config.ts` + `package.json` |
| API server | 5000 | `server/.env` → `PORT` |

**Subdomain not resolving on Linux (older systems)**
Some Linux distributions may not resolve `*.localhost` automatically. Add entries to `/etc/hosts`:

```
127.0.0.1  public.localhost
127.0.0.1  admin.localhost
127.0.0.1  customer.localhost
127.0.0.1  api.localhost
```

**HMR (hot reload) not working**
Ensure WebSocket connections are not blocked. The proxy forwards WS upgrades automatically.

---

## Production

In production, the subdomain routing is handled by **Nginx** (see `nginx/nginx.conf`) rather than the dev proxy. Each app is built to static files and served by its own Nginx container.

```bash
docker compose up -d --build
docker compose exec server npm run db:setup
```

See `docs/getting-started.md` for the full Docker deployment guide.
