# Documentation

This directory contains the implementation-facing documentation for Portfolio V3 SaaS. It is intended to stay close to the current codebase rather than describe an idealized version of the product.

## What Was Updated

This documentation refresh brings the docs in line with the current repository state, including:

- the three-app frontend layout under `apps/public`, `apps/admin`, and `apps/customer`
- the local single-port development proxy at `dev-proxy/index.js`
- customer portal authentication, sessions, OAuth, payments, and messaging
- admin-side notifications, customers, email templates, and page sections
- the current OpenAI-backed chatbot implementation and fallback behavior
- Prisma-backed caching, analytics, diagnostics, and recent backend modules
- the current docs roadmap in [`tasks/upcoming.md`](tasks/upcoming.md)

These updates were additive and corrective. The goal was to preserve the existing docs structure while making the content more accurate and more complete.

## Structure

```text
docs/
├── README.md
├── chatbot.md
├── customer-portal.md
├── getting-started.md
├── local-dev-setup.md
├── migrations.md
├── schema.md
├── testing.md
├── tasks/
│   └── upcoming.md
├── architecture/
│   ├── analytics.md
│   ├── backend.md
│   ├── frontend.md
│   ├── payments.md
│   ├── platform.md
│   └── system.md
├── public/
│   ├── public-documentation.pdf
│   └── visitor-guide.md
└── admin/
    ├── admin-documentation.pdf
    └── admin-guide.md
```

## Recommended Reading Order

If you are new to the repository, read the docs in this order:

1. [getting-started.md](getting-started.md)
2. [architecture/platform.md](architecture/platform.md)
3. [architecture/system.md](architecture/system.md)
4. [architecture/backend.md](architecture/backend.md)
5. [architecture/frontend.md](architecture/frontend.md)
6. [customer-portal.md](customer-portal.md)
7. [admin/admin-guide.md](admin/admin-guide.md)
8. [chatbot.md](chatbot.md)
9. [tasks/upcoming.md](tasks/upcoming.md)

## Architecture Docs

| Document | Description |
| --- | --- |
| [architecture/platform.md](architecture/platform.md) | High-level product topology, apps, routing, deployment surfaces |
| [architecture/system.md](architecture/system.md) | Request lifecycle, auth flows, runtime boundaries, deployment view |
| [architecture/backend.md](architecture/backend.md) | Express server, controllers, services, middleware, caching, modules |
| [architecture/frontend.md](architecture/frontend.md) | React app structure, routing, context, current state management patterns |
| [architecture/payments.md](architecture/payments.md) | Stripe checkout, webhook handling, customer portal payment flows |
| [architecture/analytics.md](architecture/analytics.md) | Event tracking, sessions, insights, diagnostics, presence, caching |

## Product Docs

| Document | Description |
| --- | --- |
| [public/visitor-guide.md](public/visitor-guide.md) | Public-site behavior, visitor journey, and major pages |
| [admin/admin-guide.md](admin/admin-guide.md) | Admin panel capabilities and operational workflows |
| [customer-portal.md](customer-portal.md) | Customer auth, portal pages, sessions, messaging, notifications |
| [chatbot.md](chatbot.md) | AI/chatbot behavior, context building, limits, and configuration |

## Planning Docs

| Document | Description |
| --- | --- |
| [tasks/upcoming.md](tasks/upcoming.md) | Easy → medium → hard roadmap tailored to the current codebase |

## Quick Reference

### Start The Full Platform

```bash
npm run install:all
cp server/.env.example server/.env
docker compose up -d postgres
npm run db:setup
npm run dev
```

### Local URLs

- `http://public.localhost:5173`
- `http://admin.localhost:5173`
- `http://customer.localhost:5173`
- `http://api.localhost:5173`

### Database Commands

```bash
npm run db:setup
npm run db:migrate
npm run db:deploy
npm run db:generate
npm run db:seed
```

### Default Seeded Admin

- Email: `admin@portfolio.dev`
- Password: `Admin@123456`
