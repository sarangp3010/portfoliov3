# System Architecture

## Overview

Portfolio V3 SaaS is a layered web platform with:

- React frontends for public, admin, and customer experiences
- a shared Express API
- PostgreSQL via Prisma
- optional external providers such as Stripe, SMTP, Twilio, OpenAI, Google OAuth, and GitHub OAuth

```text
┌────────────────────────────────────────────────────────────────────┐
│                         Browser Clients                            │
│  Public App  |  Admin App  |  Customer App                        │
└──────────────────────────────┬─────────────────────────────────────┘
                               │ HTTP / JSON / Auth headers
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                    Express API (server/:5000)                     │
│ Routes · Controllers · Services · Middleware · Prisma            │
└───────────────┬──────────────────────┬─────────────────────────────┘
                │                      │
                ▼                      ▼
      ┌───────────────────┐   ┌───────────────────────────────────┐
      │ PostgreSQL        │   │ External Providers                │
      │ Prisma models     │   │ Stripe · SMTP · Twilio · OpenAI  │
      │ cache/log data    │   │ Google OAuth · GitHub OAuth      │
      └───────────────────┘   └───────────────────────────────────┘
```

## Request Lifecycles

### Public Content Request

Example: visitor opens the home page.

1. The browser loads the public app shell.
2. The public app boots routing, helmet, and theme context.
3. The app fetches content such as profile, projects, services, and theme data.
4. The tracking hook posts analytics events to `/api/analytics/track`.
5. The API upserts visitor/session records and stores page/content events.
6. The UI renders content and interactive sections.

### Admin Authenticated Request

Example: admin opens the inquiries page.

1. The admin app loads and checks the stored admin JWT.
2. The request is sent with `Authorization: Bearer <token>`.
3. `authenticate` verifies the JWT.
4. `adminOnly` ensures the role is `ADMIN`.
5. The controller validates input and fetches or updates records.
6. A consistent JSON response is returned.
7. Notifications, email sending, caching, or background-style fire-and-forget tasks may also run.

### Customer Authenticated Request

Example: customer opens payment methods.

1. The customer app restores the customer token from local storage.
2. The token is sent in the `Authorization` header.
3. `customerAuth` verifies the JWT and enforces the `CUSTOMER` role.
4. The controller uses the authenticated email/id to scope access.
5. The API may call Stripe helpers to list or modify payment methods.
6. The portal renders the result and can link the user into the next action.

### Payment Request

The platform has two payment entry paths:

- public/service-led checkout
- customer portal direct checkout

Shared lifecycle:

1. Frontend requests a checkout session.
2. The server creates a Stripe checkout session.
3. A `PENDING` payment record is stored immediately.
4. Stripe hosts card entry and payment confirmation.
5. Stripe webhook posts back to the API.
6. Webhook processing updates the payment to `COMPLETED`, `FAILED`, or other terminal state.
7. The relevant UI resolves success state and can surface a receipt.

### Chat Request

The chatbot is a true system component now, not a side note.

1. Public or customer UI posts `{ message, history }` to `/api/chat`.
2. Optional JWT is decoded via `optionalAuth`.
3. The controller builds current platform context from the database.
4. If the user is a customer, customer-specific account/payment context is appended.
5. If OpenAI is configured, a chat-completions request is made.
6. If OpenAI is unavailable or errors, a rich rule-based fallback is used.
7. The server returns `{ reply, suggestions }`.

## Layer Responsibilities

### Frontend Apps

Responsibilities:

- routing and view composition
- client-side form state
- token persistence and request decoration
- rendering analytics widgets, admin tools, and customer surfaces
- invoking REST endpoints

### Routes

Responsibilities:

- URL binding
- middleware composition
- clear separation between public, admin, and customer access patterns

### Controllers

Responsibilities:

- parsing input
- lightweight validation
- mapping request to service calls
- serializing responses
- initiating side effects such as notifications or email

Note:
The current codebase is mostly controller-light, but some controllers still perform direct Prisma work. The docs should reflect the actual implementation rather than a purely idealized service-only architecture.

### Services

Responsibilities:

- reusable business logic
- analytics aggregation
- payments
- notifications
- customer auth/session operations
- email template rendering
- cache helpers
- theme and version behavior

### Middleware

Responsibilities:

- auth and role guards
- optional auth decoding
- dual-recipient auth for notifications
- request logging
- error handling
- not-found handling

### Database

Responsibilities:

- canonical persistence
- content models
- analytics/session records
- payment state
- customer state
- notification and email template records
- operational metadata such as caching and API logs

## Authentication Model

The current codebase uses JWT-based auth with role-aware middleware.

Supported flows:

- admin auth via `/api/auth/*`
- customer auth via `/api/customer/auth/*`
- optional auth for public routes that can benefit from richer context
- either-role auth for shared notification endpoints

Important implementation detail:

- admin and customer tokens are currently persisted in `localStorage` on the frontend
- this differs from older docs that described in-memory-only auth
- the docs are updated here to reflect actual code behavior

Customer auth also includes database-backed `CustomerSession` records so active sessions can be listed and terminated from admin.

## Observability And Runtime Support

The system already includes several operational support capabilities:

- API request logging via `ApiLog`
- diagnostics aggregation
- active visitor presence
- analytics summaries
- feature flags
- notifications
- cache entries stored in the database

This is one reason the platform feels closer to a real internal tool stack than a simple portfolio.

## Deployment View

### Development

```text
Browser
  -> dev-proxy :5173
      -> public app :3000
      -> admin app :3001
      -> customer app :3002
      -> API :5000
```

### Production-Oriented Topology

```text
Static frontend hosting
  ├── public domain    -> public build
  ├── admin domain     -> admin build
  └── customer domain  -> customer build

Managed / self-hosted Node runtime
  └── Express API
       └── PostgreSQL
```

### Provider Dependencies

Optional but supported:

- Stripe for payments and payment methods
- SMTP for transactional email
- Twilio for SMS notifications
- OpenAI for the assistant
- Google OAuth for customer sign-in
- GitHub OAuth for customer sign-in

If some are unset, the platform still runs, but those flows either degrade gracefully or fail only when invoked.
