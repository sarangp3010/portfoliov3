# Planned Features (Non-AI)

This document tracks planned non-AI features, ordered by effort and impact. These complement the tasks in `upcoming.md` and exclude all AI-specific work.

---

## Easy

### 1. TanStack Query across all three apps

**Who benefits:** Developer (less boilerplate), Admin, Customer (faster UI)
**Effort:** Low — no schema changes, frontend only

Steps:
- Install `@tanstack/react-query` in `apps/public`, `apps/admin`, `apps/customer`
- Add `QueryClientProvider` in each app entrypoint
- Convert the most read-heavy screens first:
  - `apps/admin`: analytics, inquiries, payments, notifications, customers
  - `apps/public`: profile, services, projects, blog, testimonials
  - `apps/customer`: payments, profile, messages, notifications
- Replace `useState + useEffect + loading` patterns with `useQuery`
- Add `useMutation` + `queryClient.invalidateQueries` for create/update/delete

Why this matters:
Removes hundreds of lines of duplicate fetch/loading/error state. Makes every future feature cleaner to build. Unlocks optimistic updates and background refetching.

---

### 2. Global admin search

**Who benefits:** Admin
**Effort:** Low — one new endpoint, one modal component

Steps:
- New endpoint: `GET /admin/search?q=...`
  - Queries: customers, inquiries, blog posts, projects, services, testimonials
  - Returns ranked results grouped by type
- Add `Cmd+K` command-bar modal in admin shell
- Show result type icon + preview text + link on click

Why this matters:
High daily utility — lets admin find anything instantly without navigating between pages.

---

### 3. Admin notes on inquiries and customers

**Who benefits:** Admin
**Effort:** Low — small schema addition

Steps:
- New `Note` model: `id`, `entityType` (inquiry | customer), `entityId`, `body`, `createdAt`
- New endpoints: `POST /admin/notes`, `GET /admin/notes/:entityType/:entityId`, `DELETE /admin/notes/:id`
- Add inline notes panel in the inquiry detail modal and customer detail page

Why this matters:
Context that doesn't belong in email — reminders, follow-up notes, internal flags per lead or customer.

---

### 4. CSV / data export

**Who benefits:** Admin
**Effort:** Low — new endpoint, no schema changes

Steps:
- `GET /admin/export/inquiries.csv`
- `GET /admin/export/payments.csv`
- `GET /admin/export/customers.csv`
- Add export button in each admin list view

Why this matters:
Useful for invoicing, reporting, and backups without needing DB access.

---

### 5. Scheduled blog posts

**Who benefits:** Admin
**Effort:** Low — one field addition, small cron job

Steps:
- Add `publishAt: DateTime?` to `BlogPost` schema
- On blog post read: if `publishAt` has passed and `published = false`, auto-publish
- Alternatively, add a scheduler job (fits the BullMQ queue already in place)
- Show scheduled status in the admin blog list

Why this matters:
Write content ahead of time and let it go live automatically.

---

## Medium

### 6. CRM-style inquiry pipeline

**Who benefits:** Admin
**Effort:** Medium — schema change, new admin UI surface

Steps:
- Add `stage` field to `Inquiry`: `new | qualified | proposal_sent | won | lost`
- Add `stageUpdatedAt` timestamp
- New endpoint: `PATCH /admin/inquiries/:id/stage`
- Add pipeline board or list view with stage columns in admin
- Add stage filter to existing inquiry list
- Track stage history in a `InquiryStageHistory` table (optional)

Why this matters:
Turns inquiries from a notification inbox into an actual lead management workflow.

---

### 7. Customer project workspace

**Who benefits:** Admin, Customer
**Effort:** Medium — new schema, admin + customer views

Steps:
- New `Project` (workspace) model linked to a customer: `id`, `customerId`, `title`, `status`, `description`, `milestones[]`, `files[]`, `notes`, `updatedAt`
- Admin endpoints: create, update, add milestone, add file link, add note
- Customer endpoint: read-only view of their workspace
- Admin page: workspace manager per customer
- Customer portal page: "My Project" tab

Why this matters:
Transforms the customer portal from a payments screen into a real delivery experience.

---

### 8. Support ticket system

**Who benefits:** Admin, Customer
**Effort:** Medium — upgrade existing message thread

Steps:
- Add `subject`, `status` (open | in_progress | resolved), `priority` (low | normal | high) to the message model or a new `Ticket` model
- Admin can update status and priority
- Customer sees ticket status in their portal
- Admin gets notifications on new tickets
- Filter and sort tickets by status/priority in admin

Why this matters:
Gives both sides a clear workflow instead of a flat unstructured message thread.

---

### 9. Payment refunds and manual adjustments

**Who benefits:** Admin
**Effort:** Medium — Stripe API integration

Steps:
- New endpoint: `POST /admin/payments/:id/refund` — triggers Stripe refund
- New endpoint: `POST /admin/payments/:id/note` — log a manual credit or dispute note
- Show refund status and notes in the admin payment detail
- Send refund confirmation email to customer via existing email service

Why this matters:
Currently there is no way to handle refunds or disputes without going directly to the Stripe dashboard.

---

### 10. Public portfolio filtering and search

**Who benefits:** Visitors (public site)
**Effort:** Medium — mostly frontend, light backend

Steps:
- Add tech stack filter to the projects page (`/projects?tech=React`)
- Add search to the blog page (`/blog?q=...`)
- Backend: add `q` query param support to `GET /projects` and `GET /blog`
- Frontend: filter bar UI on projects page, search input on blog page

Why this matters:
Makes the public site more navigable as the number of projects and posts grows.

---

### 11. Sitemap and SEO metadata endpoint

**Who benefits:** Visitors (discoverability), Admin (SEO)
**Effort:** Medium — new endpoint, no schema changes

Steps:
- `GET /sitemap.xml` — generates sitemap from profile, blog posts, projects
- `GET /seo/:page` — returns title, description, og:image for each public page
- Public app consumes `/seo/:page` to set meta tags
- Auto-update sitemap when content changes (or cache with short TTL)

Why this matters:
Makes the public site indexable without any CMS. Directly improves search discoverability.

---

## Medium-Hard

### 12. Coupon and discount codes

**Who benefits:** Admin, Customers (conversion)
**Effort:** Medium-Hard — new schema, Stripe checkout integration

Steps:
- New `DiscountCode` model: `code`, `type` (percent | flat), `value`, `maxUses`, `usedCount`, `expiresAt`, `active`
- Admin endpoints: create, list, toggle, delete discount codes
- Apply discount at checkout: `POST /payments/checkout` accepts `couponCode`, validates and applies before creating Stripe session
- Show discounted price in checkout UI
- Track usage per code

Why this matters:
Common conversion tool for freelance platforms — run promotions or give referral discounts.

---

### 13. Webhook subscriptions

**Who benefits:** Admin (integrations), Developer
**Effort:** Medium-Hard — new schema, delivery system

Steps:
- New `Webhook` model: `url`, `secret`, `events[]` (inquiry.created | payment.completed | customer.registered), `active`
- Admin endpoints: create, list, update, delete webhooks
- On relevant events, fan out to registered URLs via the BullMQ queue already in place
- Sign payloads with HMAC using the webhook secret
- Log delivery attempts and retry on failure (3 attempts, exponential backoff)

Why this matters:
Connects the platform to Zapier, Slack, Notion, or any external tool without building native integrations.

---

## Hard

### 14. Milestone billing

**Who benefits:** Admin, Customer
**Effort:** Hard — new schema, Stripe + customer portal integration

Steps:
- New `Milestone` model linked to customer workspace: `title`, `amount`, `dueDate`, `status` (pending | invoiced | paid)
- Admin creates milestones and triggers invoice per milestone
- Each invoice creates a Stripe checkout session for the specific amount
- Customer sees milestone list and pay buttons in their portal
- Email notification when a milestone invoice is issued

Why this matters:
Staged payments are the standard for freelance project work. Pairs directly with the customer project workspace.

---

### 15. Audit log and activity trail

**Who benefits:** Admin, Developer
**Effort:** Hard — new schema, middleware changes

Steps:
- New `AuditLog` model: `actorId`, `actorType` (admin | customer | system), `action`, `entityType`, `entityId`, `before`, `after`, `ip`, `createdAt`
- Middleware or service-level hook to log all admin write operations automatically
- Admin page: searchable audit log with filters by actor, entity type, date range
- Retention policy: auto-purge entries older than 90 days via BullMQ scheduled job

Why this matters:
Essential for debugging, compliance, and multi-admin accountability.

---

### 16. Multi-admin and role system

**Who benefits:** Admin (teams)
**Effort:** Hard — auth and permission changes throughout

Steps:
- Add `EDITOR` role: can manage content (blog, projects, services, testimonials) but not payments, customers, or settings
- Update `adminOnly` middleware to accept a `requiredRole` parameter
- Update all admin routes to specify minimum role
- Admin UI: show/hide actions based on current user role
- Admin can invite and manage other admin users

Why this matters:
Makes the platform usable by a small team without giving everyone full access.

---

## Suggested Build Order

Maximum impact with steady momentum:

1. TanStack Query — foundation, unblocks frontend everywhere
2. Global admin search — quick win, high daily use
3. Admin notes — trivial schema, immediate value
4. Scheduled blog posts — small addition, big convenience
5. CRM inquiry pipeline — turns leads into a real workflow
6. Customer project workspace — biggest portal upgrade
7. Support ticket system — cleaner than flat messages
8. Milestone billing — completes the delivery + payment loop
9. Coupon codes — conversion feature
10. Webhook subscriptions — extensibility without native integrations
11. Sitemap + SEO — discoverability
12. Payment refunds — operational completeness
13. CSV export — operational completeness
14. Audit log — compliance and debugging
15. Multi-admin roles — team readiness
