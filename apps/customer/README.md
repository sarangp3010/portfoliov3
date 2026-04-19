# Customer App

The customer app is the authenticated client portal. It gives end customers a self-service area for account access, payments, saved payment methods, notifications, and communication with the admin.

## Purpose

- Register and log in customers
- Support OAuth return handling
- Show a customer dashboard and profile area
- Display payment history and payment success states
- Manage saved payment methods
- Let customers contact the admin from inside the portal
- Surface customer-specific notifications

## Tech

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- Stripe.js

## Entry Points

- `src/main.tsx` boots the app with `BrowserRouter`.
- `src/App.tsx` sets up `CustomerAuthProvider`, route protection, redirect behavior, and lazy-loaded pages.

## Route Map

- `/login` → customer login
- `/register` → customer signup
- `/auth/callback` → OAuth completion flow
- `/payment/success` → post-checkout success page
- `/dashboard` → customer overview
- `/services` → available services from the portal perspective
- `/payments` → payment history and actions
- `/payment-methods` → saved payment method management
- `/contact-admin` → customer-to-admin messaging
- `/profile` → account details
- `/notifications` → customer notifications

## Important Folders

- `src/pages/customer` contains the portal pages
- `src/components/auth` contains auth-related UI pieces
- `src/components/layout` contains the customer shell
- `src/components/ui` contains reusable customer-facing components
- `src/context` contains customer auth state
- `src/api` contains customer/auth/payment API wrappers
- `src/hooks`, `src/config`, and `src/types` support the portal

## Development

From the repo root:

```bash
npm run dev:customer
```

From this directory:

```bash
npm run dev
npm run build
npm run preview
```

## Notes

- Route protection is implemented directly in `src/App.tsx` using the customer auth context.
- OAuth success and error redirects are configured on the backend and resolve back into this app.
- Stripe payment method setup and checkout flows depend on the backend customer payment endpoints.
