# Portfolio V3 SaaS

Production-grade portfolio SaaS platform with a public marketing site, admin dashboard, customer portal, and a shared Node.js/Express API.

![React](https://img.shields.io/badge/React-18-20232A?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql)

## Quick Start

```bash
npm run install:all
cp server/.env.example server/.env
docker compose up -d postgres
npm run db:setup
npm run dev
```

Open:

- `http://public.localhost:5173`
- `http://admin.localhost:5173`
- `http://customer.localhost:5173`
- `http://api.localhost:5173`

## Overview

Portfolio V3 SaaS is a self-hosted full-stack platform for running a modern developer portfolio as a business, not just a static website. It combines a public-facing portfolio, a secure admin console, and a customer self-service portal behind a shared REST API.

The application supports publishing profile and content data, capturing and managing inquiries, running Stripe payment flows, tracking visitor analytics, managing dynamic page sections and themes, sending notifications, and maintaining customer accounts with direct auth and OAuth sign-in.

### Key Use Cases

- Launch a multi-page developer portfolio with blog, projects, services, testimonials, and resume
- Manage content, inquiries, feature flags, theme settings, and email templates from an admin dashboard
- Accept payments and review revenue analytics
- Give customers a portal for profile updates, payment history, payment methods, and admin communication
- Track visitor journeys, engagement, diagnostics, and behavior trends

### Target Users

- Independent developers and consultants
- Agencies running a personal-brand or service-led website
- Small SaaS teams that need a branded public site plus internal operations tools

## Features

- Multi-frontend architecture: public site, admin dashboard, and customer portal
- Secure admin and customer authentication with JWT-based session flows
- OAuth support for customer login via Google and GitHub
- Stripe Checkout integration, webhook processing, receipts, and payment analytics
- Dynamic content management for profile, blog, projects, services, testimonials, and resumes
- Theme management with runtime customization and feature flags
- Dynamic page section management for controlled UI composition
- Visitor analytics with session timelines, event tracking, active visitor reporting, and smart insights
- Notification system and email template management
- PDF data endpoints for resume, portfolio, and analytics export flows
- Dev proxy for single-port local development across subdomains
- Code-split React apps for faster initial loads and isolated deployment targets

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Framer Motion
- Axios
- React Helmet Async
- Recharts
- Stripe.js in the customer portal

### Backend

- Node.js 20
- Express 4
- TypeScript
- Prisma ORM
- JWT authentication
- Multer for uploads
- Nodemailer for email delivery
- Twilio for SMS integrations

### Database

- PostgreSQL

### Tools

- Docker Compose for local database orchestration
- Netlify for static frontend deployment
- Winston for logging
- Jest and Vitest for test coverage
- Local reverse proxy for subdomain-based development

## Architecture

The repository is organized as a monorepo with three React applications under `apps/` and a shared Express API under `server/`. Each frontend is independently built and served, while the backend owns authentication, business logic, persistence, analytics, payments, notifications, and integrations.

### High-Level Flow

1. The public, admin, and customer frontends send requests to the Express API.
2. Express routes delegate work to controllers and service-layer modules.
3. Prisma handles database access to PostgreSQL.
4. External integrations such as Stripe, SMTP, OAuth providers, Twilio, and OpenAI are invoked from backend services when enabled.
5. Built frontend artifacts are emitted into `dist/public`, `dist/admin`, and `dist/customer` for deployment.

### State, Caching, and Async Work

- Frontend state is primarily route-driven and context-based for auth/theme concerns
- Analytics, notifications, payments, and content operations are fetched over REST
- Request logging is fire-and-forget and does not block response flow
- Rate limiting protects sensitive routes such as auth, chat, and inquiries
- Service modules isolate async operations such as payment processing, email dispatch, and analytics aggregation

## Folder Structure

This repository uses `apps/` instead of a single `client/` directory. Conceptually, `apps/` is the client layer.

```text
.
├── apps/
│   ├── public/                  # Public portfolio frontend
│   │   ├── src/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── context/
│   │   │   ├── hooks/
│   │   │   ├── pages/public/
│   │   │   ├── types/
│   │   │   └── utils/
│   ├── admin/                   # Admin dashboard frontend
│   │   ├── src/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── context/
│   │   │   ├── hooks/
│   │   │   ├── pages/admin/
│   │   │   ├── tests/
│   │   │   └── utils/
│   └── customer/                # Customer portal frontend
│       ├── src/
│       │   ├── api/
│       │   ├── components/
│       │   ├── context/
│       │   ├── hooks/
│       │   ├── pages/customer/
│       │   └── types/
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── templates/
│   │   ├── types/
│   │   └── utils/
│   ├── tests/
│   └── uploads/
├── dev-proxy/                   # Single-port localhost subdomain router
├── dist/                        # Built frontend artifacts
├── docs/                        # Product and engineering documentation
├── scripts/                     # Build helpers
└── docker-compose.yml
```

If you want a classic mental model:

- `client/` maps to `apps/public`, `apps/admin`, and `apps/customer`
- `server/` maps to `server/`
- `shared/` is not currently a dedicated package in this repository

## Getting Started

### Prerequisites

- Node.js `20+`
- npm `9+`
- Docker and Docker Compose
- PostgreSQL if you are not using the provided Docker setup

### Installation

1. Clone the repository.

```bash
git clone <repository-url>
cd "portfolio_v3_saas (2)"
```

2. Install all dependencies.

```bash
npm run install:all
```

3. Create the backend environment file.

```bash
cp server/.env.example server/.env
```

4. Start PostgreSQL.

```bash
docker compose up -d postgres
```

5. Generate the Prisma client, run migrations, and seed demo data.

```bash
npm run db:setup
```

### Environment Variables

Example `server/.env`:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL="postgresql://portfolio:portfolio@localhost:5432/portfolio?schema=public"

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d

CLIENT_URL=http://public.localhost:5173
CUSTOMER_URL=http://customer.localhost:5173

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ops@example.com
SMTP_PASS=app-password
SMTP_FROM="Portfolio V3 <ops@example.com>"
ADMIN_EMAIL=ops@example.com

STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15551234567

OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini

GOOGLE_CLIENT_ID=google-client-id
GOOGLE_CLIENT_SECRET=google-client-secret
GOOGLE_CALLBACK_URL=http://api.localhost:5173/api/customer/auth/google/callback

GITHUB_CLIENT_ID=github-client-id
GITHUB_CLIENT_SECRET=github-client-secret
GITHUB_CALLBACK_URL=http://api.localhost:5173/api/customer/auth/github/callback

OAUTH_SUCCESS_URL=http://customer.localhost:5173/auth/callback
OAUTH_ERROR_URL=http://customer.localhost:5173/login
```

### Run the App

Development:

```bash
npm run dev
```

Individual services:

```bash
npm run dev:public
npm run dev:admin
npm run dev:customer
npm run dev:api
npm run dev:proxy
```

Production build:

```bash
npm run build:all
npm run build --prefix server
```

Production run:

```bash
npm run start --prefix server
```

## API Documentation

### Base URL

Local development through the proxy:

```text
http://api.localhost:5173/api
```

### Sample Endpoints

#### Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "env": "development"
}
```

#### Get Profile

```http
GET /api/profile
```

Response:

```json
{
  "success": true,
  "data": {
    "name": "Your Name",
    "title": "Full-Stack Software Engineer",
    "available": true
  }
}
```

#### Admin Login

```http
POST /api/auth/login
Content-Type: application/json
```

Request:

```json
{
  "email": "admin@portfolio.dev",
  "password": "Admin@123456"
}
```

Representative response:

```json
{
  "success": true,
  "token": "<jwt>",
  "user": {
    "id": "clx123",
    "email": "admin@portfolio.dev",
    "role": "ADMIN"
  }
}
```

#### Create Stripe Checkout Session

```http
POST /api/payments/checkout
Content-Type: application/json
```

Request:

```json
{
  "type": "service",
  "title": "Professional",
  "amount": 450000,
  "customerEmail": "client@example.com"
}
```

Representative response:

```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_123",
    "url": "https://checkout.stripe.com/c/pay/cs_test_123"
  }
}
```

#### Customer Profile Update

```http
PUT /api/customer/profile
Authorization: Bearer <customer-jwt>
Content-Type: application/json
```

Request:

```json
{
  "name": "Alex Rivera",
  "company": "Rivera Studio"
}
```

### Core API Areas

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

## Scripts

### Root

| Script | Description |
| --- | --- |
| `npm run dev` | Run proxy, API, and all three frontend apps concurrently |
| `npm run install:all` | Install dependencies across root, server, apps, and proxy |
| `npm run build:all` | Build all frontend apps and assemble `dist/` output |
| `npm run db:setup` | Run backend DB initialization and seed data |
| `npm run db:migrate` | Run Prisma migrations from the backend package |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:seed` | Seed the database |
| `npm run dev:api` | Start only the backend |
| `npm run dev:public` | Start only the public app |
| `npm run dev:admin` | Start only the admin app |
| `npm run dev:customer` | Start only the customer app |
| `npm run dev:proxy` | Start only the localhost subdomain proxy |

### Server

| Script | Description |
| --- | --- |
| `npm run dev --prefix server` | Start the API in watch mode |
| `npm run build --prefix server` | Compile TypeScript to `dist/` |
| `npm run start --prefix server` | Run the compiled server |
| `npm run test --prefix server` | Run backend tests |
| `npm run db:init --prefix server` | Deploy migrations and generate Prisma client |
| `npm run db:migrate --prefix server` | Run Prisma migrate dev |
| `npm run db:deploy --prefix server` | Deploy migrations in production |
| `npm run db:generate --prefix server` | Generate Prisma client |
| `npm run db:seed --prefix server` | Run seed script |
| `npm run db:studio --prefix server` | Open Prisma Studio |

## Deployment

### Frontend

The frontends are built into:

- `dist/public`
- `dist/admin`
- `dist/customer`

This repository already includes a root [`netlify.toml`](./netlify.toml) configured to:

- install frontend dependencies
- build all apps from the monorepo root
- publish the `dist/` directory
- route custom domains and subdomains to the correct SPA shell

### Backend

Deploy the Express API as a separate Node.js service:

1. Provision PostgreSQL.
2. Set all required environment variables.
3. Build the API.
4. Run Prisma migrations in deploy mode.
5. Start the compiled server behind a reverse proxy or managed Node host.

Typical production commands:

```bash
npm install --prefix server
npm run build --prefix server
npm run db:deploy --prefix server
npm run start --prefix server
```

### Recommended Production Topology

- Netlify for the three frontend apps
- Managed Node hosting for the Express API
- Managed PostgreSQL for persistence
- Stripe webhooks pointed to the production API domain
- SMTP credentials configured for transactional email

## Performance Considerations

- React routes are lazy-loaded to reduce initial bundle size
- Separate frontend apps isolate code paths and deployment surfaces
- Prisma-backed queries rely on indexed schema fields for common filters and lookups
- Express rate limiting protects high-risk or abuse-prone endpoints
- Static uploads are served directly by Express from the uploads directory
- Request logging is non-blocking
- Build output is precompiled for static hosting
- Analytics and diagnostics are separated into service-layer modules to keep route handling lean
- The single-port dev proxy improves local parity without adding runtime complexity in production

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Keep changes scoped and documented.
4. Run relevant frontend and backend tests before opening a pull request.
5. Update docs when behavior, routes, or setup changes.

For larger changes, prefer:

- small pull requests
- explicit migration notes for schema changes
- screenshots or recordings for UI changes
- endpoint notes for API contract changes

## License

This project is licensed under the MIT License unless your repository policy specifies otherwise.

## Author

Sarang Patel
