# Backend Architecture

## Overview

The backend lives in `server/` and is a TypeScript Express application backed by Prisma and PostgreSQL. It serves all three frontend apps and concentrates nearly all domain logic in one package.

This backend is broader than a typical portfolio API. It currently covers:

- admin auth
- customer auth and sessions
- public content APIs
- Stripe checkout and payment state
- analytics tracking and summaries
- diagnostics and API logs
- notifications
- email templates
- page sections
- chatbot context and OpenAI integration

## Boot Process

### `src/server.ts`

Current responsibilities:

- ensure the uploads directory exists
- connect Prisma
- verify SMTP configuration where available
- bind the server to `127.0.0.1` in development and `0.0.0.0` in production
- log local access guidance for the dev proxy

### `src/app.ts`

Current middleware setup includes:

- `helmet`
- `cors`
- `express-rate-limit`
- `express.json`
- `express.urlencoded`
- static uploads serving
- request logging
- health check
- `/api` route mounting
- not found and error handling

Notable runtime details:

- CORS explicitly allows configured frontend URLs and `*.localhost`
- chat, auth, and inquiry routes have dedicated rate limits
- uploads are served from `/uploads`
- request logging is intentionally non-blocking

## Route Surface

The single router in `src/routes/index.ts` currently covers these groups:

- admin auth
- profile
- projects
- blog
- services
- testimonials
- resume
- inquiries
- analytics summary APIs
- real-time active visitors and session timelines
- smart insights and nav flows
- diagnostics
- feature flags
- version history
- payments
- PDF export data
- theme settings
- customer auth
- customer OAuth
- customer profile/payments/payment methods/messages
- admin-side customer management
- chatbot
- email templates
- notifications
- page sections

This is a broad API surface, and it is worth documenting explicitly because older docs underplayed how much functionality now lives in the backend.

## Controllers

The controllers are generally thin and focused on:

- parsing params/body/query
- validating required fields
- calling Prisma or service helpers
- returning a standard JSON envelope

However, the codebase is mixed in an honest way:

- some flows are cleanly service-oriented
- some controllers still contain direct Prisma access

That is not unusual for a growing product. It just means future cleanup should move AI and high-complexity workflow logic into dedicated services instead of adding more controller weight.

Important current controller modules:

- `analytics.controller.ts`
- `chat.controller.ts`
- `content.controller.ts`
- `customer.controller.ts`
- `diagnostics.controller.ts`
- `email-templates.controller.ts`
- `notifications.controller.ts`
- `oauth.controller.ts`
- `page-sections.controller.ts`
- `payment.controller.ts`

## Services

Key service modules already present:

### `analytics.service.ts`

Handles:

- visitor creation/upsert
- page views
- analytics events
- content events
- visitor insight summaries
- session-aware event storage

### `diagnostics.service.ts`

Handles:

- API diagnostics aggregation
- navigation flow analysis
- smart insights generation
- event log retrieval

Important note:
The current “smart insights” are deterministic summaries computed from database state. They are not yet LLM-generated analytics summaries.

### `payment.service.ts`

Handles:

- checkout session creation
- service plan generation
- Stripe webhook handling
- payment method setup/listing/removal
- payment analytics

### `customer.service.ts`

Handles:

- customer registration
- login/logout
- OAuth account linking/login
- session creation and validation
- customer updates
- admin customer listing/detail/session management

### `notification.service.ts`

Handles:

- admin and customer notifications
- unread counts
- marking notifications read

### `email-template.service.ts`

Handles:

- loading database-backed templates
- fallback template usage
- template variable rendering
- subject and HTML generation

This is a significant operational feature because it means outgoing email behavior is configurable rather than being locked into hardcoded strings alone.

### `cache.service.ts`

Handles:

- DB-backed cache reads/writes
- TTL expiry
- prefix invalidation
- cached function wrapper

This is already a real subsystem in the current backend, though it is backed by Prisma/PostgreSQL rather than Redis.

## Middleware

### Auth Middleware

Current auth middleware in `src/middleware/auth.ts` includes:

- `authenticate`
- `customerAuth`
- `adminOnly`
- `optionalAuth`
- `eitherAuth`

These support:

- standard protected admin routes
- customer-only routes
- public routes with optional enrichment
- shared notification routes for both roles

### Request Logger

The request logger writes `ApiLog` records asynchronously with:

- method
- path
- status
- duration
- IP
- user agent
- authenticated user ID where available
- error message where available

This powers the diagnostics UI in admin.

### Error Handling

The backend uses centralized not-found and error middleware and returns a consistent JSON shape, generally:

```json
{
  "success": false,
  "error": "Human-readable message"
}
```

## Database Domains

The backend data model is organized into clear functional groups.

### Content

- `Profile`
- `Project`
- `BlogPost`
- `Service`
- `Testimonial`
- `Resume`
- `Inquiry`
- `PageSection`
- `ThemeSetting`
- `ContentVersion`

### Analytics And Operations

- `Visitor`
- `PageView`
- `AnalyticsEvent`
- `VisitorSession`
- `ContentEvent`
- `ActiveVisitor`
- `ApiLog`
- `CacheEntry`
- `FeatureFlag`

### Payments And Customer

- `Payment`
- `PaymentWebhookEvent`
- `Customer`
- `CustomerSession`
- `CustomerMessage`
- `Notification`
- `EmailTemplate`

## Current Backend Additions Worth Noting

The backend is ahead of some of the older docs in these areas:

- database-backed cache entries
- active visitor presence
- notifications for both admins and customers
- seeded email templates with fallback rendering
- page-section CRUD and default section seeding
- manual Google and GitHub OAuth
- customer session management visible to admins
- OpenAI-backed chat with customer-aware context

These features are already implemented and should be considered part of the present system, not speculative future work.

## Backend Improvement Direction

Based on the current codebase, the next backend improvements with the highest leverage are:

- move more complex logic out of controllers into service modules
- create a dedicated `services/ai/` area for upcoming AI workflows
- add cache invalidation consistently on admin writes
- consider Redis later for cache and background-job support

Those changes would extend the current architecture cleanly without forcing a rewrite.
