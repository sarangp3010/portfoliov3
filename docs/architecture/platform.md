# Platform Architecture

## Overview

This platform is a full-stack SaaS-style portfolio system with three frontend applications and a single shared API server.

```
/
├── /apps
│   ├── /public       ← Public developer website
│   ├── /admin        ← Admin dashboard
│   └── /customer     ← Customer portal
├── /server           ← Shared API (Node.js + Express + Prisma)
├── /nginx            ← Subdomain routing config
└── /docs             ← Documentation
```

## Application Routing

| URL | Application | Description |
|-----|-------------|-------------|
| `public.example.com` | `/apps/public` | Developer portfolio site |
| `admin.example.com` | `/apps/admin` | Admin management dashboard |
| `customer.example.com` | `/apps/customer` | Customer portal |
| `api.example.com` | `/server` | REST API |

All subdomains are routed by the Nginx reverse proxy at port 80.

## Single-Server Deployment

All containers run on the same host. The Nginx proxy handles subdomain-based routing:

```
Internet → Nginx :80
              ├── public.*    → app-public:80
              ├── admin.*     → app-admin:80
              ├── customer.*  → app-customer:80
              └── api.*       → server:5000
```

This means only **one server** (with DNS wildcard) is needed to serve all applications.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| API | Node.js, Express, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL 16 |
| Payments | Stripe Checkout |
| Email | Nodemailer (SMTP) |
| SMS | Twilio (optional) |
| Container | Docker + Docker Compose |
| Reverse Proxy | Nginx |

## Authentication

Two separate auth flows:

1. **Admin auth** — `POST /api/auth/login` — `role: ADMIN` JWT
2. **Customer auth** — `POST /api/customer/auth/login` — `role: CUSTOMER` JWT

Both use the same `JWT_SECRET`, differentiated by the `role` claim.

## Database Schema

Key models:
- `User` — Admin users
- `Customer` — Portal customers with OAuth provider support
- `CustomerSession` — Per-login session tracking
- `CustomerMessage` — Contact-admin messages
- `Payment` — Stripe payment records (linked to customers)
- `Service` — Service plans
- Analytics, blog, project, testimonial, resume models...

See `docs/schema.md` for full schema documentation.

## Local Development (Single-Port Proxy)

During development all traffic enters through **one port** (`5173`). A lightweight Node.js proxy (`dev-proxy/index.js`) reads the subdomain from the `Host` header and forwards to the correct internal server:

```
Browser → dev-proxy :5173
            ├── public.localhost   → Vite (public)    127.0.0.1:3000
            ├── admin.localhost    → Vite (admin)      127.0.0.1:3001
            ├── customer.localhost → Vite (customer)   127.0.0.1:3002
            └── api.localhost      → Express API       127.0.0.1:5000
```

All internal servers bind to `127.0.0.1` — they are not externally accessible. WebSocket connections (Vite HMR) are also proxied, so hot reload works normally.

Start everything with one command from the project root:

```bash
npm run dev
```

See [`docs/local-dev-setup.md`](../local-dev-setup.md) for full details.

## Production (Nginx)

## Production (Nginx)

In production, Nginx handles subdomain routing instead of the dev proxy. Each app is built to static files:

```bash
docker compose up -d --build
docker compose exec server npm run db:setup
```
