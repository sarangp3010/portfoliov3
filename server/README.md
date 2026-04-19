# Server

This package contains the shared backend API for the portfolio SaaS platform. It powers the public site, admin dashboard, and customer portal.

## Responsibilities

- Admin authentication and protected management APIs
- Public content APIs for profile, projects, blog, services, testimonials, and resume
- Inquiry capture and content version history
- Visitor analytics, session timelines, diagnostics, and smart insights
- Stripe checkout, webhook handling, payment analytics, and receipts
- Theme, feature flag, and dynamic page section management
- Customer registration, login, OAuth, profile, payments, sessions, and messaging
- Notifications, email templates, SMTP delivery, SMS integrations, and chatbot support

## Stack

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- JWT auth
- Stripe
- Nodemailer
- Twilio
- Winston

## Runtime Entry Points

- `src/server.ts` connects Prisma, verifies SMTP, ensures uploads exist, and starts the HTTP server.
- `src/app.ts` configures middleware, CORS, rate limits, static uploads, logging, health checks, and mounts `/api`.
- `src/routes/index.ts` defines the full API surface.

## Key Source Folders

- `src/controllers` contains route handlers for auth, content, analytics, payments, customer portal, notifications, and more
- `src/services` contains business logic such as analytics aggregation, payment orchestration, email templates, notifications, theme, and versioning
- `src/middleware` contains auth, error handling, and request logging
- `src/config` contains environment/config loading and Prisma setup
- `src/templates` contains email or notification templates used by services
- `src/types` and `src/utils` contain shared backend types and infrastructure utilities

## Database

- `prisma/schema.prisma` is the canonical schema
- `prisma/migrations` contains incremental schema history
- `prisma/seed.ts` seeds the default admin account, starter content, and system email templates

Seed login:

- Email: `admin@portfolio.dev`
- Password: `Admin@123456`

## High-Value API Areas

- `/api/auth/*` for admin auth
- `/api/profile`, `/api/projects`, `/api/blog`, `/api/services`, `/api/testimonials`, `/api/resume`
- `/api/inquiries`
- `/api/analytics/*` and `/api/dev/*`
- `/api/payments/*` and `/api/admin/payments/*`
- `/api/customer/*`
- `/api/admin/email-templates/*`
- `/api/notifications*`
- `/api/sections/*` and `/api/admin/sections/*`
- `/api/chat`

## Development Commands

From the repo root:

```bash
npm run dev:api
npm run db:setup
npm run db:migrate
npm run db:generate
npm run db:seed
```

From this directory:

```bash
npm run dev
npm run build
npm run start
npm run test
npm run test:coverage
npm run db:init
npm run db:migrate
npm run db:deploy
npm run db:generate
npm run db:seed
npm run db:studio
```

## Configuration Notes

- Required environment values include `DATABASE_URL`, `JWT_SECRET`, and any provider-specific secrets you enable.
- Optional integrations include SMTP, Stripe, Twilio, OpenAI, Google OAuth, and GitHub OAuth.
- Local development is designed to work with the subdomain proxy, especially `api.localhost:5173`, `public.localhost:5173`, `admin.localhost:5173`, and `customer.localhost:5173`.
