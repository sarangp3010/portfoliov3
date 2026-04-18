# Documentation

This directory contains all technical documentation for Portfolio V3.

---

## Structure

```
docs/
├── README.md                           ← This file
├── getting-started.md                  ← Clone → install → run
├── migrations.md                       ← Database migration reference
├── schema.md                           ← Full schema reference
├── architecture/
│   ├── system.md                       ← System architecture overview
│   ├── backend.md                      ← Server, services, middleware
│   ├── frontend.md                     ← React, routing, design system
│   ├── payments.md                     ← Stripe payment module
│   └── analytics.md                    ← Analytics system deep-dive
├── public/
│   ├── visitor-guide.md                ← Visitor features, flows, use cases
│   └── public-documentation.pdf        ← PDF version
└── admin/
    ├── admin-guide.md                  ← Admin panel reference, use cases
    └── admin-documentation.pdf         ← PDF version
```

---

## Architecture Docs

| Document | Description |
|---|---|
| [architecture/system.md](architecture/system.md) | Three-tier architecture, request lifecycle, auth, deployment |
| [architecture/backend.md](architecture/backend.md) | Express server, controllers, services, middleware, migrations |
| [architecture/frontend.md](architecture/frontend.md) | React app, routing, context, design system, animations |
| [architecture/payments.md](architecture/payments.md) | Stripe integration, webhook processing, receipt PDF |
| [architecture/analytics.md](architecture/analytics.md) | Event tracking, session scoring, smart insights |

---

## Project Documentation PDF

A professional engineering documentation PDF covering all modules is available:

📄 **[project-documentation.pdf](project-documentation.pdf)** — Full technical documentation (architecture, features, database schema, API reference, deployment guide)

---

## Quick Reference — Database Commands

```bash
# cd server first, then:
npm run db:setup     # first-time: deploy migrations + seed
npm run db:migrate   # create new migration after editing schema.prisma
npm run db:deploy    # apply migrations in CI/production
npm run db:reset     # wipe and rebuild local DB (dev only)
npm run db:studio    # open Prisma Studio GUI
```

---

## Quick Reference — Start the Project

```bash
git clone <repo> && cd portfolio_v3_saas
cd server && npm install && cp .env.example .env   # fill in DATABASE_URL + JWT_SECRET + STRIPE_*
npm run db:setup          # initialise database
npm run dev               # start API on :5000

cd ../apps/public && npm install
cd ../apps/admin && npm install
cd ../apps/customer && npm install
npm run dev   # apps/public :3000, apps/admin :3001, apps/customer :3002
```

Default admin: `admin@portfolio.dev` / `Admin@123456`
