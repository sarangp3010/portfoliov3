# Frontend Architecture

## Overview

The frontend layer is intentionally split into three separate apps:

- `apps/public`
- `apps/admin`
- `apps/customer`

All three use:

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

The public and admin apps also use `react-helmet-async`. The customer app uses Stripe.js in the payment-method and checkout flows.

## Application Entrypoints

### Public App

`apps/public/src/main.tsx` mounts:

- `BrowserRouter`
- `HelmetProvider`
- the root app

`apps/public/src/App.tsx` wraps the route tree in:

- `ThemeProvider`
- a tracked route shell that invokes analytics hooks

### Admin App

`apps/admin/src/main.tsx` mounts:

- `BrowserRouter`
- `HelmetProvider`
- the root app

`apps/admin/src/App.tsx` wraps the route tree in:

- `AuthProvider`
- `ThemeProvider`
- `ProtectedRoute`
- `AdminLayout`

### Customer App

`apps/customer/src/main.tsx` mounts:

- `BrowserRouter`
- the root app

`apps/customer/src/App.tsx` wraps routes in:

- `CustomerAuthProvider`
- a local `ProtectedRoute`
- `CustomerLayout`

## Routing

### Public Routes

- `/`
- `/blog`
- `/blog/:slug`
- `/services`
- `/testimonials`
- `/resume`
- `/payment/success`
- `/payment/cancel`

### Admin Routes

- `/login`
- `/`
- `/analytics`
- `/analytics/sessions`
- `/insights`
- `/payments`
- `/customers`
- `/email-templates`
- `/notifications`
- `/page-sections`
- `/profile`
- `/blog`
- `/projects`
- `/services`
- `/testimonials`
- `/resume`
- `/inquiries`
- `/flags`
- `/diagnostics`
- `/theme`
- `/settings`

This is more extensive than older frontend docs suggested. In particular, the admin app is now a true operations dashboard, not just a content editor.

### Customer Routes

- `/login`
- `/register`
- `/auth/callback`
- `/payment/success`
- `/dashboard`
- `/services`
- `/payments`
- `/payment-methods`
- `/contact-admin`
- `/profile`
- `/notifications`

## Context Providers

### Admin Auth Context

The current admin auth implementation:

- restores token from `localStorage`
- calls `/auth/me` on startup
- stores token and serialized user locally
- clears auth on 401

This is important because some older docs described in-memory-only auth. The actual codebase currently persists auth in browser storage.

### Customer Auth Context

The customer portal auth context:

- restores `customer_token` from `localStorage`
- calls `/customer/auth/me`
- exposes `customer`, `loading`, `login`, and `logout`

### Theme Context

Theme context exists in public and admin apps and fetches `/api/theme` to apply CSS variables and light/dark behavior.

Theme values currently include:

- mode
- primary color
- accent color
- sans/mono/display fonts
- border radius
- animation speed
- custom CSS

## Data Fetching Pattern

The current frontend architecture relies mostly on:

- `useState`
- `useEffect`
- `useCallback`
- local page-managed loading/error state
- React Context only for auth/theme

That means the apps are functional and straightforward, but they currently do not use a dedicated server-state library such as TanStack Query.

This shows up especially in:

- repeated loading state patterns
- repeated API fetch boilerplate
- manual refetch behavior after mutations
- duplicated request handling across admin pages

The docs should reflect this honestly because it directly informs the roadmap.

## Analytics Hooks

The public and admin codebases both contain tracker hooks, but public visitor analytics are the primary analytics source.

Current tracking implementation includes:

- session ID in `sessionStorage`
- device ID in `localStorage`
- route-level tracking
- explicit content/event helpers

Tracked behaviors include things like:

- page views
- blog views and blog engagement
- project interactions
- resume interactions
- service inquiry interactions
- inquiry submits

## Chatbot Integration

The chatbot is mounted in:

- `apps/public/src/components/layout/PublicLayout.tsx`
- `apps/customer/src/components/layout/CustomerLayout.tsx`

Important details:

- the public app uses the assistant without auth
- the customer app passes the current auth token for customer-aware support
- the UI supports suggestions and rendered links
- it is not currently mounted in the admin app

## Current State Management Summary

Use the current architecture as:

- React Context for auth and theme
- component-local state for forms, modals, filters, pagination, and temporary UI
- Axios modules for API access

Do not describe this repo as Redux-based. It is not.

## Recommended Frontend Evolution

The best next frontend architecture improvement is:

- add TanStack Query for server state

Why that fits better than Redux:

- most current complexity is API/state synchronization, not local event-driven state
- the apps already have many fetch-heavy pages
- cache + invalidation would help more than a global reducer store

Redux could make sense later only if the project introduces genuinely complex cross-page client-side workflows such as:

- multi-step builders
- cross-view draft editors
- real-time collaborative state
- large shared UI orchestration

At the current stage, TanStack Query plus the existing contexts is the cleaner direction.
