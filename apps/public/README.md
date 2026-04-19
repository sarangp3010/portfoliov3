# Public App

The public app is the marketing and portfolio frontend. It serves the personal brand, project showcase, blog, services funnel, testimonials, resume page, and Stripe payment completion pages.

## Purpose

- Present the developer profile and featured work
- Publish blog content and individual blog posts
- Capture service interest and inquiry traffic
- Show testimonials and resume content
- Handle payment success and cancel return flows from Stripe
- Track visitor activity through the analytics hooks and API

## Tech

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- React Helmet Async

## Entry Points

- `src/main.tsx` boots the app with `BrowserRouter` and `HelmetProvider`.
- `src/App.tsx` defines lazy-loaded routes and wraps the app in `ThemeProvider`.

## Route Map

- `/` → home page
- `/blog` → blog index
- `/blog/:slug` → blog details
- `/services` → service offerings and inquiry/payment entry points
- `/testimonials` → social proof
- `/resume` → resume page and export flow
- `/payment/success` → Stripe success state
- `/payment/cancel` → Stripe cancellation state

## Important Folders

- `src/pages/public` contains the visitor-facing pages
- `src/components/layout` contains the public shell and shared layout pieces
- `src/components/ui` contains reusable presentation components
- `src/hooks` contains tracking and frontend behavior hooks
- `src/context` includes theme state and related providers
- `src/api` contains calls to the backend API
- `src/config`, `src/types`, and `src/utils` hold app configuration, types, and helpers

## Development

From the repo root:

```bash
npm run dev:public
```

From this directory:

```bash
npm run dev
npm run build
npm run preview
```

## Notes

- The public app is the main source of analytics events for visitor journeys and content engagement.
- Theme data is loaded from the backend so public presentation can be updated from the admin dashboard.
- Payment result pages rely on the shared backend payment endpoints under `/api/payments`.
