# Apps Workspace

This directory contains the three frontend applications that make up the portfolio SaaS platform.

## Apps

| App | Directory | Default Port | Purpose |
| --- | --- | --- | --- |
| Public site | `apps/public` | `3000` | Visitor-facing portfolio, blog, services, resume, testimonials, and payment result pages |
| Admin dashboard | `apps/admin` | `3001` | Internal management console for content, analytics, payments, theme, notifications, and customer operations |
| Customer portal | `apps/customer` | `3002` | Authenticated client area for profile, payments, saved payment methods, notifications, and messaging |

## Shared Frontend Patterns

- All three apps use Vite + React 18 + TypeScript.
- Routing is handled with `react-router-dom`.
- API communication is handled with Axios-based clients in each app's `src/api`.
- Styling is based on Tailwind CSS with app-specific layouts and UI components.
- Builds from the app packages are collected into the repo-level `dist/` output during `npm run build:all`.

## Common Commands

Run from the repository root:

```bash
npm run dev
npm run dev:public
npm run dev:admin
npm run dev:customer
npm run build:all
```

Run from an individual app directory:

```bash
npm run dev
npm run build
npm run preview
```

## Where To Start

- Use [`public/README.md`](./public/README.md) for the visitor-facing site.
- Use [`admin/README.md`](./admin/README.md) for the admin dashboard.
- Use [`customer/README.md`](./customer/README.md) for the client portal.
