# Admin App

The admin app is the internal operations dashboard for managing portfolio content, customer activity, business settings, and analytics.

## Purpose

- Authenticate admins and protect management routes
- Edit profile, projects, blog posts, services, testimonials, and resumes
- Review inquiries, customer records, notifications, and customer messages
- Monitor analytics, diagnostics, session journeys, revenue, and insights
- Manage theme settings, feature flags, page sections, and email templates

## Tech

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- React Helmet Async
- Vitest and Testing Library

## Entry Points

- `src/main.tsx` mounts the React app with router and helmet support.
- `src/App.tsx` wires `AuthProvider`, `ThemeProvider`, `ProtectedRoute`, and the lazy-loaded admin pages.

## Main Routes

- `/login` → admin sign-in
- `/` → dashboard overview
- `/analytics` and `/analytics/sessions` → analytics and session inspection
- `/insights` → smart insights and behavior summaries
- `/payments` → payment operations and revenue analytics
- `/customers` → customer account management
- `/email-templates` → notification and template management
- `/notifications` → in-app notification center
- `/page-sections` → dynamic public/admin page section controls
- `/profile`, `/blog`, `/projects`, `/services`, `/testimonials`, `/resume` → content management
- `/inquiries`, `/flags`, `/diagnostics`, `/theme`, `/settings` → system and business controls

## Important Folders

- `src/pages/admin` contains feature pages for each admin surface
- `src/components/admin` contains admin layout and dashboard-specific building blocks
- `src/components/layout` and `src/components/ui` contain shared shells and reusable UI
- `src/context` contains auth and theme state
- `src/api` contains dashboard-facing API clients
- `src/tests` contains frontend test coverage
- `src/hooks`, `src/config`, `src/types`, and `src/utils` contain shared frontend support code

## Development

From the repo root:

```bash
npm run dev:admin
```

From this directory:

```bash
npm run dev
npm run test
npm run test:watch
npm run test:coverage
npm run build
```

## Notes

- This app is the control center for most of the newer platform features, including notifications, email templates, page sections, theme management, and customer administration.
- Protected routes depend on the admin auth context and backend JWT endpoints.
- The dashboard expects the API server to be running and reachable through the dev proxy or configured URLs.
