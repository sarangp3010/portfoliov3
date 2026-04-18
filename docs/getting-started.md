# Getting Started

## Project Structure

```
/apps
  /public     ← Public developer website  (Vite + React, internal :3000)
  /admin      ← Admin dashboard           (Vite + React, internal :3001)
  /customer   ← Customer portal           (Vite + React, internal :3002)
/server       ← REST API                  (Node.js + Express, internal :5000)
/dev-proxy    ← Single-port subdomain router  (port 5173)
/nginx        ← Production reverse proxy config
/docs         ← Documentation
```

All frontend apps are accessed through **one port (5173)** via subdomain routing. See [`docs/local-dev-setup.md`](local-dev-setup.md) for how this works.

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 20 LTS |
| npm | 10 |
| PostgreSQL | 14 (or Docker) |

---

## Step 1 — Clone

```bash
git clone https://github.com/your-username/portfolio-v3.git
cd portfolio-v3
```

---

## Step 2 — Install all dependencies

```bash
npm run install:all
```

Installs packages for root, server, all three apps, and the dev proxy in one command.

---

## Step 3 — Configure environment

```bash
cp .env.example .env
```

Required values to fill in:

```env
DATABASE_URL=postgresql://portfolio:changeme@localhost:5432/portfolio
JWT_SECRET=replace-with-a-long-random-string    # openssl rand -base64 64
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

The `CLIENT_URL` and `CUSTOMER_URL` are pre-set in `.env.example` to the subdomain dev URLs (`http://public.localhost:5173`, `http://customer.localhost:5173`) — leave them as-is for local development.

---

## Step 4 — Start PostgreSQL

```bash
# Using Docker (recommended)
docker compose up -d postgres

# Or use a hosted database (Neon, Supabase, Railway) — set DATABASE_URL accordingly
```

---

## Step 5 — Set up the database

```bash
npm run db:setup
```

Runs all migrations and seeds the database with demo data and a default admin account.

**Default admin credentials**

| Field | Value |
|---|---|
| Email | `admin@portfolio.dev` |
| Password | `Admin@123456` |

Change the password immediately after first login via **Admin → Settings**.

---

## Step 6 — Start everything

```bash
npm run dev
```

Five processes start in parallel, colour-coded in the terminal:

| Colour | Process | Port |
|--------|---------|------|
| Cyan | Dev proxy (subdomain router) | 5173 |
| Yellow | Express API server | 5000 |
| Green | Public site (Vite) | 3000 |
| Magenta | Admin dashboard (Vite) | 3001 |
| Blue | Customer portal (Vite) | 3002 |

---

## Step 7 — Open in browser

| URL | Application |
|---|---|
| http://public.localhost:5173 | Public portfolio site |
| http://admin.localhost:5173 | Admin dashboard |
| http://admin.localhost:5173/login | Admin login |
| http://customer.localhost:5173 | Customer portal |
| http://customer.localhost:5173/login | Customer login / register |
| http://api.localhost:5173/health | API health check |

---

## Individual commands

Run any part of the platform independently:

```bash
npm run dev:proxy     # proxy only
npm run dev:api       # Express server only
npm run dev:public    # public Vite app only
npm run dev:admin     # admin Vite app only
npm run dev:customer  # customer Vite app only
```

---

## Docker Compose (all-in-one production)

```bash
cp .env.example .env   # set production values
docker compose up -d --build
docker compose exec server npm run db:setup
```

See [`docs/local-dev-setup.md`](local-dev-setup.md) for full local development details.

---

## Troubleshooting

**Subdomain not loading** — Wait a few seconds for all Vite servers to start. The proxy returns a 502 page if the target isn't ready yet.

**Port conflict** — Change ports in `dev-proxy/index.js` (proxy), each app's `vite.config.ts`, or `server/.env` (`PORT`).

**`*.localhost` not resolving** — Add manually to `/etc/hosts`: `127.0.0.1 public.localhost admin.localhost customer.localhost api.localhost`

**Prisma client not found** — Run `npm run db:generate` to regenerate after schema changes.
