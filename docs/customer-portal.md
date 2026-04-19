# Customer Portal

## Overview

The customer portal is the authenticated client-facing application of the platform. It gives customers a persistent account area instead of limiting the product to a one-time public inquiry or checkout flow.

This is one of the most meaningful expansions of the codebase beyond a traditional portfolio site.

## Current App Structure

```text
apps/customer/
├── src/api
├── src/components/auth
├── src/components/layout
├── src/components/ui
├── src/config
├── src/context
├── src/hooks
├── src/pages/customer
└── src/types
```

## Current Pages

| Route | Purpose |
| --- | --- |
| `/login` | Customer login |
| `/register` | Customer registration |
| `/auth/callback` | OAuth completion |
| `/dashboard` | Overview screen |
| `/services` | Customer-facing service purchase flow |
| `/payments` | Payment history |
| `/payment-methods` | Stripe payment methods |
| `/contact-admin` | Message the admin |
| `/profile` | Update profile fields |
| `/notifications` | Customer notifications |
| `/payment/success` | Stripe success return route |

## Authentication

The customer portal uses JWT auth for API requests and also tracks database-backed sessions for operational control.

Current behavior:

- customer JWT stored in `localStorage`
- API requests include `Authorization: Bearer <token>`
- customer session records stored in `CustomerSession`
- logout can invalidate session tokens
- admins can inspect and terminate active customer sessions

## Supported Login Methods

### Email/Password

Current flow:

- register via `/api/customer/auth/register`
- login via `/api/customer/auth/login`
- validate current session via `/api/customer/auth/me`

### OAuth

Current supported providers in implementation:

- Google
- GitHub

Important docs correction:

- older docs referenced Microsoft as supported
- the current implemented OAuth controller covers Google and GitHub
- the Prisma enum still includes `microsoft`, but the implemented routes do not currently expose a Microsoft flow

## Customer Features

### Dashboard

Acts as a customer overview surface and quick entry point into:

- services
- payments
- profile
- messaging

### Payments

Customers can:

- view payment history
- see statuses
- access receipt data

### Payment Methods

Customers can:

- open a Stripe setup flow
- add payment methods
- remove saved payment methods

### Contact Admin

Customers can send messages that become `CustomerMessage` records. Admins can reply from the admin interface, and those replies can trigger:

- notification creation
- email delivery to the customer

### Notifications

Customer notifications use the same shared notification system as admin notifications, scoped by role and recipient ID.

## Session Management

The current codebase supports an actual customer session model:

- `CustomerSession` stores token, device/browser info, login time, expiry, and active state
- admin can view active sessions
- admin can terminate sessions

This is a meaningful operational feature and should be documented as part of the current platform, not as future work.

## Messaging Model

Customer messaging is currently lightweight but real:

- customer sends a message from the portal
- a `CustomerMessage` record is created
- admin is notified
- admin can reply
- reply is stored and can be emailed to the customer

This is not yet a full threaded messaging system, but it is already a valid support/contact workflow.

## Notifications Model

Customer users can access:

- paginated notifications
- unread count
- mark-one-read
- mark-all-read

These are powered by the shared `/api/notifications*` routes using role-aware auth.

## AI Assistant In The Portal

The customer portal currently mounts the assistant widget with auth token support.

That means the portal already has:

- a customer-aware assistant entry point
- account-sensitive context when authenticated
- room to evolve into a stronger support assistant later

## Environment Requirements

Relevant server environment values include:

```env
JWT_SECRET=...
CUSTOMER_URL=http://customer.localhost:5173

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://api.localhost:5173/api/customer/auth/google/callback

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://api.localhost:5173/api/customer/auth/github/callback

OAUTH_SUCCESS_URL=http://customer.localhost:5173/auth/callback
OAUTH_ERROR_URL=http://customer.localhost:5173/login
```

Optional integrations:

- Stripe
- SMTP
- Twilio

## Current Gaps

The portal is already useful, but it does not yet include:

- project workspaces
- invoices or milestone billing
- threaded conversations
- file uploads
- proposal acceptance

Those are strong future directions, but the current portal should already be documented as a real product surface, not a placeholder.
