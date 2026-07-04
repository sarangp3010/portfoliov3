# CLAUDE.md — AI Agent Guide

This file is the primary context document for any AI model working on this codebase. Read it before touching any file.

---

## What this project is

A full-stack portfolio SaaS platform. It has three distinct user-facing apps, one shared Express API, and a PostgreSQL database via Prisma.

**Public site** — A portfolio website for a freelance developer. Visitors browse projects, blog posts, services, and can submit inquiries or buy services.

**Admin dashboard** — The owner manages all content (profile, projects, blog, services, testimonials), views analytics, handles inquiries and payments, and manages customers.

**Customer portal** — Authenticated customers can view their payments, receipts, messages, and notifications.

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React + TypeScript + Vite (three apps) |
| Backend | Express + TypeScript (Node.js) |
| Database | PostgreSQL via Prisma ORM |
| Cache | Redis (ioredis) with Prisma fallback |
| Queue | BullMQ (backed by Redis) |
| Payments | Stripe |
| Email | Nodemailer (SMTP) via BullMQ queue |
| Auth | JWT (admin), JWT (customer), Google + GitHub OAuth |
| AI | OpenAI (chatbot only) |
| Frontend server state | TanStack Query (all three apps) |

---

## Project structure

```
portfoliov3/
├── apps/
│   ├── public/          # Public portfolio site (Vite + React)
│   ├── admin/           # Admin dashboard (Vite + React)
│   └── customer/        # Customer portal (Vite + React)
├── server/              # Express API (shared by all three apps)
│   ├── src/
│   │   ├── config/      # App config, Prisma client, Redis client
│   │   ├── controllers/ # Route handlers (one file per domain)
│   │   ├── middleware/  # Auth, error handler, request logger
│   │   ├── routes/      # index.ts — all routes in one file
│   │   ├── services/    # Business logic, cache, queue, email, analytics
│   │   ├── workers/     # BullMQ workers (email, analytics)
│   │   └── types/       # Shared TypeScript types
│   └── prisma/          # Schema, migrations, seed
├── docs/
│   └── tasks/           # Task lifecycle docs (see below)
├── docker-compose.yml   # Postgres + Redis + all apps
└── CLAUDE.md            # This file
```

---

## Key files to know

| File | What it does |
|---|---|
| `server/src/routes/index.ts` | Every API route in one place — always check here first |
| `server/src/services/cache.service.ts` | `cached()`, `cacheGet/Set/Delete/Pattern` — Redis + Prisma fallback |
| `server/src/services/queue.service.ts` | BullMQ queues, `enqueueEmail()`, `scheduleRecurringJobs()` |
| `server/src/services/email.service.ts` | All email sends — goes through `sendEmail()` which uses queue when wired |
| `server/src/config/redis.ts` | Redis client for cache; `getBullMQConnection()` for BullMQ |
| `server/src/server.ts` | Boot sequence — DB → Redis → queues → workers → HTTP |
| `server/prisma/schema.prisma` | Full data model |
| `docs/tasks/planned.md` | 16 non-AI features with steps and effort ratings |
| `docs/tasks/in-progress.md` | Active task being worked on |
| `docs/tasks/completed.md` | Finished tasks with commit hashes and notes |

---

## Task system

Tasks live in `docs/tasks/`. The lifecycle is:

```
planned.md / upcoming.md  →  in-progress.md  →  completed.md
```

- **`upcoming.md`** — original full roadmap (AI + non-AI features)
- **`planned.md`** — detailed non-AI features with steps, effort, and build order
- **`in-progress.md`** — the task currently being worked on (one at a time)
- **`completed.md`** — permanent log of finished work

### Before starting any task

1. Read the task entry in `planned.md` or `upcoming.md`
2. Move it to `in-progress.md` and fill in branch and start date
3. Read every file you will touch before changing anything
4. Identify what already exists — never duplicate work

### After finishing a task

1. Run `npx tsc --noEmit` in `server/` — zero errors required before committing
2. Commit with a descriptive message (see commit style below)
3. Add a full entry to `completed.md`: what was done, files changed, commit hash, date
4. Remove the task from `in-progress.md`

---

## Caching rules

Every public read endpoint and admin analytics endpoint must use `cached()`. The pattern is consistent:

```ts
// Read
const data = await cached('cache:key', () => prisma.thing.findMany(...), 5 * 60_000);

// Write — always invalidate after
await cacheDeletePattern('cache:key:prefix');
// or
await cacheDelete('cache:exact-key');
```

Cache key namespaces in use:

| Prefix | Data |
|---|---|
| `profile:` | Profile |
| `projects:` | Projects list and individual |
| `posts:` / `blog:` | Blog posts and tags |
| `services:` | Services |
| `testimonials:` | Testimonials |
| `resume:` | Resume |
| `theme:` | Theme |
| `payments:` | Plans, list, analytics |
| `analytics:` | Summary, blogs, projects, visitors, flows, insights |
| `sections:public:` | Page sections by page |
| `inquiries:list:` | Inquiry list |
| `feature_flags:` | Feature flags |
| `pdf:` | PDF export data (resume-data, portfolio-data) |

Redis is used when `REDIS_URL` is set. Falls back to the Prisma `CacheEntry` table automatically — no controller changes needed.

---

## Email rules

All emails go through `emailService.sendEmail()`. When Redis is available, emails are queued via BullMQ and processed by `workers/email.worker.ts` with 3 retries and exponential backoff. When Redis is not available they send synchronously.

Never call `nodemailer` directly in a controller. Use the functions in `email.service.ts`.

---

## Testing

```bash
cd server && npm test                          # Jest — mocks prisma/nodemailer/stripe/logger
cd server && npm test -- --testPathPattern=email
cd apps/admin && npm test                       # Vitest + Testing Library
cd apps/admin && npx vitest run src/tests/modal.test.tsx
```

`apps/public` and `apps/customer` have no real test runner wired up — their `npm test` just runs `npm run build`. Don't claim or assume frontend test coverage for those two apps.

---

## Coding conventions

- **TypeScript** — no `any` unless unavoidable; run `tsc --noEmit` before every commit
- **Controllers** — thin: validate, call service or Prisma, respond. No business logic.
- **Services** — all business logic lives here, not in controllers
- **No new files unless necessary** — prefer editing existing files
- **No comments on obvious code** — only comment non-obvious logic
- **Error handling** — all controller functions use `try/catch` and call `next(err)`
- **Cache invalidation** — every admin write must invalidate the relevant cache keys
- **No Redux** — React Context for auth/theme; TanStack Query for server state. Query keys live in `apps/admin/src/lib/queryKeys.ts` and `apps/customer/src/lib/queryKeys.ts`; page-level query hooks live under `apps/*/src/hooks/queries/`. Check there before adding new `useState`/`useEffect` fetch boilerplate to a page.

---

## Commit style

```
type: short description of what and why

- bullet details if needed

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `docs`, `refactor`, `chore`

Always include `Co-Authored-By` line.

---

## What NOT to do

- Do not add AI features unless explicitly asked — AI tasks are separate from this roadmap
- Do not introduce Redux or Zustand unless there is a proven shared client-state problem
- Do not run `prisma migrate dev` without asking — migrations affect the shared DB
- Do not push to `origin` unless the user asks
- Do not commit `.env` files
- Do not add error handling for scenarios that cannot happen
- Do not add docstrings, comments, or type annotations to code you did not change
- Do not create new files when editing an existing one is sufficient

---

## Local development

Primary workflow — one command, single port, subdomain-routed:

```bash
npm run install:all      # root, server, all three apps, dev-proxy
docker compose up -d postgres   # add `redis` too if testing the queue/cache path
npm run db:setup
npm run dev               # dev-proxy (:5173) + API (:5001) + public/admin/customer, concurrently
```

Then open `http://public.localhost:5173`, `http://admin.localhost:5173`, `http://customer.localhost:5173`, `http://api.localhost:5173` — `dev-proxy/index.js` routes each subdomain to its internal Vite/Express port, no `/etc/hosts` edits needed. Default seeded admin: `admin@portfolio.dev` / `Admin@123456`.

To run one piece at a time instead: `npm run dev:proxy`, `npm run dev:api`, `npm run dev:public`, `npm run dev:admin`, `npm run dev:customer` (or `cd server && npm run dev`, `cd apps/<app> && npm run dev` directly — these bind to their raw Vite/Express ports, e.g. `:3001` for admin, bypassing the proxy).

Alternative — full Docker stack (closer to prod topology, includes Redis and nginx):

```bash
docker compose up -d --build
docker compose exec server npm run db:setup
```

Required env vars (see `server/.env`):
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — at least 32 chars
- `REDIS_URL` — optional, falls back to Prisma cache if not set
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` — for payments
- `SMTP_USER`, `SMTP_PASS` — for emails (Gmail app password recommended)

---

## Docs vs. code — known drift

`docs/architecture/frontend.md` and `docs/architecture/backend.md` predate the TanStack Query and Redis/BullMQ work and still describe the old Context+`useEffect`-only frontend and pure-Prisma cache. Trust this file and the code over those two docs until someone refreshes them. `docs/schema.md`, `docs/migrations.md`, and `docs/testing.md` are accurate as of this writing.
