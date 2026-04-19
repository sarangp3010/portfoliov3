# Platform Architecture

## Overview

Portfolio V3 SaaS is a multi-application platform built around one shared backend and three separate React frontends:

- `apps/public` for the visitor-facing portfolio
- `apps/admin` for internal management and operations
- `apps/customer` for authenticated customer self-service
- `server` for the shared Express + Prisma API

This split is one of the strongest architectural choices in the repository. Each app stays focused on its own audience while sharing a common API surface and domain model.

## Current Repository Layout

```text
/
├── apps/
│   ├── public/      # Public portfolio app
│   ├── admin/       # Admin dashboard
│   └── customer/    # Customer portal
├── server/          # Shared API, Prisma, tests, uploads
├── dev-proxy/       # Single-port local subdomain proxy
├── dist/            # Built frontend artifacts
├── docs/            # Engineering and product documentation
├── scripts/         # Build helpers
└── nginx/           # Production-oriented reverse proxy config
```

## Application Boundaries

### Public App

Primary responsibilities:

- developer profile and branded landing experience
- project showcase
- blog browsing and post reading
- services and pricing
- testimonials
- resume view/download
- payment success/cancel routes
- public AI assistant
- visitor analytics generation

### Admin App

Primary responsibilities:

- admin authentication
- content management for profile, blog, projects, services, testimonials, and resume
- inquiry review and status management
- analytics dashboards, session viewer, smart insights, diagnostics
- payment operations and revenue review
- customer management
- notifications
- email template management
- page section management
- feature flags and theme management

### Customer App

Primary responsibilities:

- customer login/registration
- Google and GitHub OAuth callback handling
- customer dashboard and profile editing
- direct service checkout
- payment history and receipts
- saved payment methods
- notifications
- messaging the admin
- customer-aware AI assistant

### Server

Primary responsibilities:

- authentication and authorization
- REST API routing
- business logic
- Stripe integration
- analytics tracking and aggregation
- notifications and email template rendering
- customer session management
- dynamic page section configuration
- chatbot context generation and OpenAI integration
- request logging and diagnostics

## Routing Model

### Local Development

The project uses a single-port development proxy at `:5173`. This is the current local topology, and it is more accurate than older “multiple direct ports only” documentation.

```text
Browser
  └── dev-proxy :5173
        ├── public.localhost   -> apps/public Vite dev server :3000
        ├── admin.localhost    -> apps/admin Vite dev server :3001
        ├── customer.localhost -> apps/customer Vite dev server :3002
        └── api.localhost      -> Express API :5000
```

Benefits:

- one visible port for all local traffic
- subdomain parity with production-style routing
- HMR still works because WebSockets are proxied
- no `/etc/hosts` changes required for `*.localhost`

### Production-Oriented Build Topology

The repo currently supports a static-frontend + separate-API deployment style:

- frontend builds emitted to `dist/public`, `dist/admin`, and `dist/customer`
- domain/subdomain routing configured via `netlify.toml`
- API deployed independently as a Node.js service

Conceptually:

```text
Users
  ├── public domain     -> static public build
  ├── admin domain      -> static admin build
  ├── customer domain   -> static customer build
  └── API domain        -> Express server
                           └── PostgreSQL + external providers
```

The `nginx/` directory still exists in the repo, but the currently documented frontend deployment path is Netlify-oriented static hosting with a separate backend runtime.

## Shared Data Model

The platform is organized around a few major domains:

- content: `Profile`, `Project`, `BlogPost`, `Service`, `Testimonial`, `Resume`, `Inquiry`
- analytics: `Visitor`, `PageView`, `AnalyticsEvent`, `VisitorSession`, `ContentEvent`, `ActiveVisitor`
- operations: `FeatureFlag`, `ContentVersion`, `ApiLog`, `CacheEntry`, `ThemeSetting`, `PageSection`
- payments: `Payment`, `PaymentWebhookEvent`
- customer portal: `Customer`, `CustomerSession`, `CustomerMessage`
- communications: `EmailTemplate`, `Notification`

This is important because many product features are already cross-surface:

- an inquiry starts on the public app but is handled in the admin app
- a payment may be initiated publicly or from the customer portal
- notifications exist for both admin and customer audiences
- page sections and themes affect frontend presentation but are controlled from admin
- the chatbot uses public content and optional customer context

## Product Flow

At a high level, the platform supports this lifecycle:

1. A visitor lands on the public site.
2. The visitor explores projects, blog posts, services, and resume content.
3. Analytics events are recorded as they navigate.
4. The visitor submits an inquiry or starts a checkout flow.
5. The admin reviews leads, content, traffic, revenue, and system state.
6. A customer can later access the portal for payments, profile, notifications, and messaging.

That lifecycle is what makes the current roadmap around AI triage, AI content assistance, analytics summaries, and customer support especially strong for this codebase.

## Current Platform Additions Reflected In The Docs

Compared with older versions of the docs, the current codebase now clearly includes:

- customer portal auth and sessions
- manual Google and GitHub OAuth flows
- customer messages and admin replies
- notifications for admin and customer recipients
- email template management backed by database templates with fallbacks
- page section management for dynamic frontend composition
- public and customer AI assistant support
- diagnostics and API logging
- Prisma-backed cache entries

These are no longer “future ideas” in the codebase. They are present and should be treated as part of the actual platform architecture.
