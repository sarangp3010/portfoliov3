# Portfolio V3 Companion README

This file is a lighter operational companion to the main [`README.md`](./README.md). It focuses on where things live now and how to work on the codebase quickly.

## Monorepo Layout

| Path | What It Owns |
| --- | --- |
| `apps/public` | Visitor-facing portfolio, blog, services, testimonials, resume, payment return pages |
| `apps/admin` | Admin dashboard for content, analytics, payments, flags, theme, notifications, email templates, customers, and page sections |
| `apps/customer` | Customer portal for auth, profile, payments, notifications, payment methods, and admin messaging |
| `server` | Shared API, Prisma schema, migrations, seed data, Stripe, notifications, OAuth, analytics, and chatbot support |
| `dev-proxy` | Local subdomain proxy so the apps can be reached through `*.localhost:5173` |
| `dist` | Built frontend output assembled by the repo build step |
| `docs` | Supporting product, setup, architecture, and feature documentation |

## Quick Start

```bash
npm run install:all
cp server/.env.example server/.env
npm run db:setup
npm run dev
```

Main local URLs:

- `http://public.localhost:5173`
- `http://admin.localhost:5173`
- `http://customer.localhost:5173`
- `http://api.localhost:5173`

## Package-Level READMEs

- [`apps/README.md`](./apps/README.md)
- [`apps/public/README.md`](./apps/public/README.md)
- [`apps/admin/README.md`](./apps/admin/README.md)
- [`apps/customer/README.md`](./apps/customer/README.md)
- [`server/README.md`](./server/README.md)

## What Changed In This Version

This codebase now includes more than a basic portfolio site. The active implementation spans:

- Multi-app frontend separation for public, admin, and customer experiences
- Customer accounts with direct auth and OAuth callback support
- Stripe checkout, payment history, payment methods, and admin revenue views
- Notifications and email template management
- Dynamic page section management from the admin dashboard
- Theme customization and runtime feature flags
- Analytics, session tracking, diagnostics, and smart insight surfaces
- Backend support for chatbot requests and supporting service integrations

## Useful Commands

```bash
npm run dev
npm run build:all
npm run dev:public
npm run dev:admin
npm run dev:customer
npm run dev:api
npm run db:setup
npm run db:seed
```

## Backend Seed Defaults

The default seeded admin account is:

- Email: `admin@portfolio.dev`
- Password: `Admin@123456`

Change those values in `server/prisma/seed.ts` if you do not want the demo credentials in local development.
