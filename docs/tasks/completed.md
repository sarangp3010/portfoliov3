# Completed Tasks

This document logs all completed tasks, the changes made, and the commit(s) associated with each.

---

## Task: TanStack Query across all three apps

**Status:** Completed
**Commit:** `0214eb2`
**Date:** 2026-07-02

### What was done

Moved the frontend apps to TanStack Query-based server state handling and replaced the repeated `useState + useEffect + loading` fetch pattern on the main read-heavy screens across `apps/public`, `apps/admin`, and `apps/customer`.

#### Public app
- Added shared public query keys and hooks
- Converted public data-driven pages and section loading:
  - `Home`
  - `Blog`
  - `Services`
  - `Resume`
  - `Testimonials`
  - `useSections`

#### Admin app
- Added shared admin query keys and query/mutation hook modules
- Converted admin dashboards, management pages, and tooling screens including:
  - `Dashboard`
  - `Analytics`
  - `PaymentsManager`
  - `NotificationsPage`
  - `ProjectsManager`
  - `ServicesManager`
  - `BlogManager`
  - `TestimonialsManager`
  - `ProfileEditor`
  - `ResumeManager`
  - `CustomersManager`
  - `EmailTemplatesManager`
  - `PageSectionsManager`
  - `DevDiagnostics`
  - `InsightsPanel`
  - `FeatureFlags`
  - `SessionsViewer`

#### Customer app
- Added shared customer query keys and hooks
- Converted:
  - `Dashboard`
  - `Payments`
  - `PaymentMethods`
  - `Services`
  - `NotificationsPage`

#### Query behavior
- Added `useMutation` + invalidation flows for admin and customer write actions where the migrated pages needed them
- Centralized query key definitions per app to keep cache invalidation predictable
- Kept auth/theme/context state in React Context and moved only server state into TanStack Query

### Verification

- `npm run build --prefix apps/public`
- `npm run build --prefix apps/admin`
- `npm run build --prefix apps/customer`

### Files changed

- `apps/public/src/lib/queryKeys.ts`
- `apps/public/src/hooks/queries/usePublicQueries.ts`
- `apps/public/src/hooks/useSections.ts`
- `apps/public/src/pages/public/Home.tsx`
- `apps/public/src/pages/public/Blog.tsx`
- `apps/public/src/pages/public/Services.tsx`
- `apps/public/src/pages/public/Resume.tsx`
- `apps/public/src/pages/public/Testimonials.tsx`
- `apps/admin/src/lib/queryKeys.ts`
- `apps/admin/src/hooks/queries/useDashboardQuery.ts`
- `apps/admin/src/hooks/queries/useAnalyticsPageQuery.ts`
- `apps/admin/src/hooks/queries/usePaymentsQueries.ts`
- `apps/admin/src/hooks/queries/useNotificationsQuery.ts`
- `apps/admin/src/hooks/queries/useContentManagerQueries.ts`
- `apps/admin/src/hooks/queries/useAdminToolingQueries.ts`
- `apps/admin/src/pages/admin/Dashboard.tsx`
- `apps/admin/src/pages/admin/Analytics.tsx`
- `apps/admin/src/pages/admin/PaymentsManager.tsx`
- `apps/admin/src/pages/admin/NotificationsPage.tsx`
- `apps/admin/src/pages/admin/ProjectsManager.tsx`
- `apps/admin/src/pages/admin/ServicesManager.tsx`
- `apps/admin/src/pages/admin/BlogManager.tsx`
- `apps/admin/src/pages/admin/TestimonialsManager.tsx`
- `apps/admin/src/pages/admin/ProfileEditor.tsx`
- `apps/admin/src/pages/admin/ResumeManager.tsx`
- `apps/admin/src/pages/admin/CustomersManager.tsx`
- `apps/admin/src/pages/admin/EmailTemplatesManager.tsx`
- `apps/admin/src/pages/admin/PageSectionsManager.tsx`
- `apps/admin/src/pages/admin/DevDiagnostics.tsx`
- `apps/admin/src/pages/admin/InsightsPanel.tsx`
- `apps/admin/src/pages/admin/FeatureFlags.tsx`
- `apps/admin/src/pages/admin/SessionsViewer.tsx`
- `apps/customer/src/lib/queryKeys.ts`
- `apps/customer/src/hooks/queries/useCustomerQueries.ts`
- `apps/customer/src/pages/customer/Dashboard.tsx`
- `apps/customer/src/pages/customer/Payments.tsx`
- `apps/customer/src/pages/customer/PaymentMethods.tsx`
- `apps/customer/src/pages/customer/Services.tsx`
- `apps/customer/src/pages/customer/NotificationsPage.tsx`

---

## Task: Expand Backend Caching for Read-Heavy Endpoints

**Status:** Completed
**Commits:** `7c0c3be`, `ee64402` (partial — cache expansion portion)
**Date:** 2026-07-02

### What was done

Audited all public read endpoints and admin analytics endpoints. Added `cached()` wrappers where missing and wired cache invalidation into all admin write operations.

#### Endpoints cached (existing, confirmed)
- `GET /profile` → `profile:public` (10 min TTL)
- `GET /projects` → `projects:all` (5 min TTL)
- `GET /blog` → `posts:${page}:${limit}:${tag}` (3 min TTL, public only)
- `GET /blog/tags` → `blog:tags` (5 min TTL)
- `GET /services` → `services:all` (5 min TTL)
- `GET /testimonials` → `testimonials:all` (5 min TTL)
- `GET /resume` → `resume:active` (5 min TTL)
- `GET /theme` → `theme:active` (10 min TTL)
- `GET /payments/plans` → `payments:plans` (5 min TTL)
- `GET /payments/analytics` → `payments:analytics:${days}` (2 min TTL)
- `GET /payments` (admin list) → `payments:list:${page}:${source}` (1 min TTL)
- `GET /analytics/summary` → `analytics:summary:${days}` (2 min TTL)
- `GET /analytics/blogs` → `analytics:blogs:${days}` (3 min TTL)
- `GET /analytics/projects` → `analytics:projects:${days}` (3 min TTL)
- `GET /analytics/visitors` → `analytics:visitors:${days}` (3 min TTL)
- `GET /analytics/flows` → `analytics:flows:${days}` (2 min TTL)
- `GET /analytics/insights` → `analytics:insights:${days}` (2 min TTL)
- `GET /sections/:page` (public) → `sections:public:${page}` (5 min TTL)
- `GET /inquiries` (admin) → `inquiries:list:${page}:${status}` (1 min TTL)

#### Gaps filled in this session
- `GET /projects/:id` → `projects:${id}` (5 min TTL); invalidated by `cacheDeletePattern('projects:')`
- `GET /blog/:slug` → `blog:post:${slug}` (5 min TTL, public only); invalidated by `cacheDeletePattern('blog:')`
- `GET /flags` (public) → fixed to use already-cached `getAllFlags()` instead of uncached `getAllFlagsDetailed()`
- `GET /pdf/resume-data` → `pdf:resume-data` (10 min TTL)
- `GET /pdf/portfolio-data` → `pdf:portfolio-data` (10 min TTL)

#### Cache invalidation wired up
- Profile writes → clears `profile:public` + `pdf:*`
- Project writes → clears `projects:*` + `pdf:*`
- Service writes → clears `services:*` + `payments:plans` + `pdf:*`
- Blog writes → clears `posts:*` + `blog:*` + `pdf:*`
- Testimonial writes → clears `testimonials:*`
- Page section writes → clears `sections:public:${page}`
- Inquiry writes → clears `inquiries:list:*`
- Theme writes → clears `theme:active`
- Resume writes → clears `resume:*`
- Flag writes → clears `feature_flags:all` (handled inside `flags.service.ts`)

#### Files changed
- `server/src/controllers/project.controller.ts`
- `server/src/controllers/blog.controller.ts`
- `server/src/controllers/content.controller.ts`
- `server/src/controllers/profile.controller.ts`
- `server/src/controllers/flags.controller.ts`
- `server/src/controllers/pdf.controller.ts`

---

## Task: Redis-Backed Cache and Background Jobs

**Status:** Completed
**Commit:** `ee64402`
**Date:** 2026-07-02

### What was done

Replaced the Prisma-backed cache with Redis (ioredis) and added BullMQ job queues for email delivery and scheduled maintenance. Everything degrades gracefully when Redis is not configured.

### Architecture

```
Request
  └── controller
        └── cached() / cacheGet() / cacheSet()
              ├── Redis available → ioredis GET/SET/SCAN (sub-millisecond)
              └── Redis unavailable → Prisma CacheEntry table (fallback)

Email send (any controller)
  └── emailService.sendEmail()
        ├── Queue wired → BullMQ email queue → email worker → SMTP
        │     └── retry: 3 attempts, exponential backoff (5s base)
        └── Queue not wired → direct SMTP (original behavior)

Scheduled (every 10 min)
  └── analytics worker → cachePurgeExpired() → clears expired Prisma entries
        (no-op when Redis is active — TTL handles expiry natively)
```

### New files
| File | Purpose |
|---|---|
| `server/src/config/redis.ts` | ioredis client singleton for cache; `getBullMQConnection()` for BullMQ (plain host/port to avoid ioredis version conflicts) |
| `server/src/services/queue.service.ts` | BullMQ Queue singletons, `enqueueEmail()`, `scheduleRecurringJobs()` |
| `server/src/workers/email.worker.ts` | Processes the `email` queue (concurrency 5), calls `sendEmailDirect()` |
| `server/src/workers/analytics.worker.ts` | Processes the `analytics` queue, runs `cachePurgeExpired()` |

### Modified files
| File | Change |
|---|---|
| `server/src/services/cache.service.ts` | Redis backend with Prisma fallback; pattern deletes use `SCAN` cursor |
| `server/src/services/email.service.ts` | `useEmailQueue()` hook + `sendEmailDirect()` for worker; `sendEmail()` enqueues when queue is wired |
| `server/src/server.ts` | Connects Redis → sets up queues → wires email queue → starts workers → schedules recurring jobs; `SIGTERM` handler |
| `server/src/config/index.ts` | Added `redis.url` |
| `docker-compose.yml` | Added `redis:7-alpine` service with `appendonly yes`, `redis_data` volume, `REDIS_URL` in server env |
| `server/.env` | Added `REDIS_URL=redis://localhost:6379` |
| `.env.example` | Added `REDIS_URL` with docs |
| `server/package.json` | Added `ioredis`, `bullmq` |

### Degradation behaviour
| Condition | Cache | Emails | Workers |
|---|---|---|---|
| `REDIS_URL` set, Redis reachable | Redis | BullMQ queue + worker | Running |
| `REDIS_URL` set, Redis unreachable | Prisma fallback | Direct SMTP | Not started |
| `REDIS_URL` not set | Prisma fallback | Direct SMTP | Not started |

### To run Redis locally
```bash
# via docker-compose (recommended)
docker compose up redis -d

# or standalone
docker run -d -p 6379:6379 redis:7-alpine
```

---

## Task: Task Management Docs System

**Status:** Completed
**Commits:** `17f4ffa`, `2cbbd07`, `e630d96`
**Date:** 2026-07-02

### What was done

Created the full task lifecycle documentation system under `docs/tasks/`.

| File | Purpose |
|---|---|
| `completed.md` | Log of every finished task with commit hash, files changed, and architecture notes |
| `in-progress.md` | Active task tracker — pre-loaded with TanStack Query sub-task checklist |
| `planned.md` | 16 non-AI features with full steps, effort ratings, rationale, and suggested build order |

The `planned.md` features cover: TanStack Query, global admin search, admin notes, CSV export, scheduled blog posts, CRM pipeline, customer project workspace, support tickets, payment refunds, public filtering/search, sitemap/SEO, coupon codes, webhook subscriptions, milestone billing, audit log, and multi-admin roles.

### Files created
- `docs/tasks/completed.md`
- `docs/tasks/in-progress.md`
- `docs/tasks/planned.md`

---

## Process

When starting a task from `upcoming.md`:

1. **Read the task definition** in `docs/tasks/upcoming.md`
2. **Explore the codebase** — read all relevant controllers, services, config files before touching anything
3. **Identify what already exists** vs what needs to be added (avoid duplicating work)
4. **Implement changes** — prefer editing existing files over creating new ones; keep changes focused
5. **Verify** — run `tsc --noEmit` to confirm no type errors
6. **Commit** with a descriptive message covering all changes in the task
7. **Log here** — add an entry to this file with: what was done, files changed, commit hash, and date
