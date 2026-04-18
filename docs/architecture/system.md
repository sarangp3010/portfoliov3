# System Architecture

## Overview

Portfolio V3 follows a **three-tier architecture**: a React SPA frontend, a RESTful Node.js API, and a PostgreSQL database. All three tiers are containerized via Docker Compose for local development and production deployment.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser Client                           │
│   React 18 SPA · Vite · Tailwind · Framer Motion · Recharts    │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTP / REST (JSON)
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Server :5000                            │
│   Express · TypeScript · JWT Auth · Stripe SDK · Prisma ORM    │
└──────────────┬──────────────────┬──────────────────────────────┘
               │                  │
               ▼                  ▼
   ┌───────────────────┐  ┌──────────────────┐
   │   PostgreSQL DB   │  │   Stripe API      │
   │   (19 tables)     │  │   (payments)      │
   └───────────────────┘  └──────────────────┘
```

---

## Request Lifecycle

### Public Request (visitor views homepage)

1. Browser fetches `index.html` from Nginx (or Vite dev server)
2. React app boots, `ThemeProvider` fetches `/api/theme` to apply CSS variables
3. `useTracker` hook fires `POST /api/analytics/track` with `PAGE_VIEW` event
4. `Home.tsx` fetches `/api/profile` and `/api/projects` in parallel
5. Responses render into animated React components

### Admin Request (admin views analytics)

1. Admin navigates to `/admin/analytics`
2. `ProtectedRoute` checks `AuthContext` for JWT in memory
3. `Analytics.tsx` fires 5 parallel API calls with `Authorization: Bearer <token>`
4. Middleware `authenticate()` verifies JWT signature and injects `req.user`
5. `adminOnly()` confirms `req.user.role === 'ADMIN'`
6. Controllers delegate to services which query Prisma
7. Data serialized to JSON, returned to React components for chart rendering

### Payment Request (client pays for service)

1. Client submits inquiry form → `POST /api/inquiries`
2. On success, client optionally clicks a deposit amount
3. Frontend calls `POST /api/payments/checkout` with amount, description, email
4. Server calls Stripe SDK to create a Checkout Session
5. Server stores a `PENDING` Payment record in DB
6. Response returns `{sessionId, url}` → browser redirects to Stripe Hosted Checkout
7. Client completes payment on Stripe's servers
8. Stripe fires webhook to `POST /api/payments/webhook`
9. Server validates signature, updates Payment to `COMPLETED`
10. Client polls `GET /api/payments/status/:sessionId` until status resolves
11. Success page shown; admin sees new transaction in Payments Manager

---

## Module Boundaries

Each module has a clear responsibility boundary:

| Layer | Responsibility |
|---|---|
| **Routes** (`routes/index.ts`) | URL binding, middleware chaining, no logic |
| **Controllers** (`controllers/*.ts`) | Request parsing, response serialization, validation |
| **Services** (`services/*.ts`) | Business logic, database queries via Prisma |
| **Middleware** (`middleware/*.ts`) | Cross-cutting concerns: auth, logging, errors |
| **Config** (`config/*.ts`) | Environment, Prisma client singleton |

### Why This Structure

Controllers are intentionally thin — they only parse `req.body`, call a service function, and call `res.json()`. This keeps services independently testable. Services own all Prisma queries, so database access is never scattered across layers.

---

## Authentication

The app uses **stateless JWT authentication**:

- Login: `POST /api/auth/login` returns a signed JWT (24-hour expiry)
- Frontend stores token in React state (not localStorage — avoids XSS risk)
- Every protected request includes `Authorization: Bearer <token>` header
- `authenticate` middleware verifies signature with `JWT_SECRET`
- `adminOnly` middleware confirms `role === 'ADMIN'`
- Token is lost on page refresh by design — users re-login when needed

---

## Database Connection

A single Prisma Client instance is created as a module-level singleton in `config/prisma.ts`. This prevents connection pool exhaustion in long-running server processes. All services import `{ prisma }` from this singleton.

---

## Error Handling

Every controller is wrapped in `try/catch` and delegates to `next(err)`. The `errorHandler` middleware in `middleware/errorHandler.ts` catches all errors, logs them via Winston, and returns a consistent JSON error response:

```json
{
  "success": false,
  "error": "Human-readable message",
  "code": 400
}
```

Unhandled 404 routes return `{ success: false, error: "Not found" }`.

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Docker Host                         │
│                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────────┐  │
│  │  Nginx   │    │  Server  │    │  PostgreSQL  │  │
│  │  :80/443 │───▶│  :5000   │───▶│  :5432       │  │
│  │  (client)│    │  (API)   │    │  (data)      │  │
│  └──────────┘    └──────────┘    └──────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

The Nginx container serves the built React SPA and proxies `/api/*` requests to the Express server. This avoids CORS issues in production and simplifies SSL termination.
