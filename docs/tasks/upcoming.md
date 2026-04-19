# Upcoming Tasks

This document tracks recommended next tasks for the platform, ordered from easy to medium to hard. The list is tailored to the current codebase: three frontend apps, one shared Express API, Prisma/PostgreSQL, analytics, payments, notifications, page sections, and the existing OpenAI-backed chatbot.

## Prioritization Principles

- Prefer features that improve the full lifecycle: visitor → inquiry/payment → admin action → customer portal retention
- Prefer changes that reuse existing surfaces before introducing brand-new product areas
- Improve data flow and caching before adding large amounts of frontend complexity
- Treat AI as a workflow layer, not just a novelty surface

## Easy Tasks

These are low-risk, high-signal tasks that fit the current structure well and can usually be delivered without large schema or architectural changes.

### 1. Add TanStack Query to the frontend apps

- Introduce `@tanstack/react-query` in `apps/public`, `apps/admin`, and `apps/customer`
- Add a shared `QueryClientProvider` in each app entrypoint
- Convert the most read-heavy screens first:
  - admin analytics
  - inquiries
  - payments
  - notifications
  - public profile/services/blog/projects
- Replace repetitive `useState + useEffect + loading` patterns with query hooks
- Add invalidation for existing create/update/delete actions

Why this matters:
This is the best non-AI improvement for the repo. It reduces repeated code, adds frontend caching, and makes future AI surfaces easier to build cleanly.

### 2. Expand backend caching for read-heavy endpoints

- Audit all public read endpoints and admin analytics endpoints
- Add `cached()` wrappers where the data is mostly read-heavy
- Start with:
  - `/profile`
  - `/projects`
  - `/blog`
  - `/services`
  - `/testimonials`
  - `/theme`
  - `/payments/plans`
  - analytics summaries and flows
- Add cache invalidation after admin writes

Why this matters:
The backend already has a cache layer. This turns it into a real performance feature.

### 3. Improve the existing AI chatbot with better boundaries

- Split AI helper logic out of `chat.controller.ts`
- Create a dedicated AI service for chat
- Add stricter prompt framing for:
  - public visitors
  - authenticated customers
- Improve refusal/redirection behavior for off-topic questions
- Add safer handling around customer-specific answers

Why this matters:
You already have AI in production shape conceptually, but the implementation should be cleaner before more AI features are added.

### 4. Add section-level analytics in the admin

- Show per-page-section visibility and engagement summaries
- Connect tracked page behavior to dynamic page section identifiers
- Display “top sections” and “low engagement sections” in admin

Why this matters:
This makes the existing page section system much more valuable.

### 5. Add global admin search

- Add search across customers, inquiries, blog posts, projects, services, and testimonials
- Start with a backend query endpoint and a simple command-bar style modal in admin

Why this matters:
This is a high-utility quality-of-life feature and makes the admin app feel much more like a real SaaS product.

## Medium Tasks

These are the best next product features for this repo. They usually require new endpoints, AI service modules, UI additions, and some schema changes.

### 6. AI Inquiry Triage

This should be the first major AI workflow feature.

Scope:

- Generate inquiry summary
- Detect urgency
- Suggest service category
- Estimate budget signal from language
- Assign lead score / conversion likelihood
- Recommend next action
- Draft suggested email reply

Suggested backend additions:

- New AI service module, for example:
  - `server/src/services/ai/inquiry-triage.service.ts`
- New admin endpoint:
  - `POST /api/admin/inquiries/:id/triage`
- Optional persistence fields on inquiry or a related triage table:
  - summary
  - urgency
  - category
  - budgetSignal
  - leadScore
  - recommendedAction
  - draftReply
  - generatedAt

Suggested frontend additions:

- Add “Generate AI Triage” inside [apps/admin/src/pages/admin/InquiriesManager.tsx](/Users/sarang_3010/Downloads/portfolio_v3_saas%20(2)/apps/admin/src/pages/admin/InquiriesManager.tsx)
- Show triage output in the inquiry modal
- Add filters such as “high priority” or “high conversion”

Why this matters:
This turns incoming inquiries into a smarter lead workflow and is the highest-impact AI feature for the current project.

### 7. AI Content Assistant

This should be the second major AI workflow feature.

Scope:

- Generate blog drafts from title + topic
- Improve project descriptions
- Expand or shorten service descriptions
- Clean up testimonial wording
- Create SEO title and meta description suggestions
- Rewrite text in different tones: concise, technical, sales-focused, premium

Suggested backend additions:

- New AI service module:
  - `server/src/services/ai/content-assistant.service.ts`
- New endpoints such as:
  - `POST /api/admin/ai/blog/generate`
  - `POST /api/admin/ai/projects/improve`
  - `POST /api/admin/ai/services/improve`
  - `POST /api/admin/ai/testimonials/cleanup`

Suggested frontend additions:

- Add AI action buttons in:
  - `BlogManager`
  - `ProjectsManager`
  - `ServicesManager`
  - `TestimonialsManager`
  - `ProfileEditor`
- Support insert, replace, and compare draft flows

Why this matters:
This is a highly visible, frequently used feature that fits the admin dashboard naturally.

### 8. AI Analytics Summaries

This should upgrade the current rule-based smart insights into a true AI-assisted decision layer.

Scope:

- Weekly narrative summaries
- Traffic change explanations
- conversion observations
- mobile vs desktop behavior notes
- notable top content
- recommended next actions

Suggested backend additions:

- New AI service module:
  - `server/src/services/ai/analytics-summary.service.ts`
- New endpoint:
  - `GET /api/admin/analytics/summary-ai?days=30`
- Optional persistence for saved summaries by time window

Suggested frontend additions:

- Add an “AI Summary” panel in [apps/admin/src/pages/admin/InsightsPanel.tsx](/Users/sarang_3010/Downloads/portfolio_v3_saas%20(2)/apps/admin/src/pages/admin/InsightsPanel.tsx)
- Allow “refresh summary” and “copy summary”
- Later add weekly archived summaries

Why this matters:
Your analytics data is already rich. This feature turns it into useful executive-style feedback.

### 9. Upgrade the customer support assistant

The chatbot already exists. The next step is turning it into a stronger customer-support feature.

Scope:

- Make responses more account-aware
- Answer questions about:
  - payments
  - receipts
  - services purchased
  - contacting admin
  - portal navigation
- Add structured suggestions based on account context
- Add escalation guidance when AI is uncertain

Suggested backend additions:

- Separate support-assistant logic from generic public portfolio chat
- Add customer-context-specific tools/helpers
- Consider dedicated prompt path for customer mode

Suggested frontend additions:

- Improve assistant placement in customer portal
- Add context-aware shortcuts like:
  - “Show my payments”
  - “How do I get my receipt?”
  - “Message admin”

Why this matters:
This is lower-risk because a basic version already exists in the codebase.

### 10. Add inquiry-to-response automations

- Auto-generate reply drafts after inquiry creation
- Optionally notify admin with an AI summary
- Suggest email template variables or best-fit template

Why this matters:
This compounds well with inquiry triage and email templates.

## Hard Tasks

These features are high-value but require larger workflow, schema, or cross-surface product changes.

### 11. AI Proposal Generator

This is strategically strong, but it should be treated as a full workflow rather than a single button.

Scope:

- Generate scope summary from inquiry
- Suggest proposal sections
- Suggest timeline
- Suggest pricing language
- Generate email-ready proposal draft
- Later support proposal approval state

Recommended implementation shape:

- New proposal model or proposal-related table
- AI generation endpoint for proposal drafts
- Admin proposal editor
- Customer-facing proposal view later

Why this matters:
This directly helps conversion, but it deserves workflow support to feel complete.

### 12. CRM-style inquiry pipeline

- Add stages such as:
  - new
  - qualified
  - proposal sent
  - won
  - lost
- Combine AI triage with pipeline stages
- Add admin board or kanban-style layout

Why this matters:
This would elevate the platform from portfolio management to lead management.

### 13. Customer project workspace

- Create per-customer project space
- Add project status, milestones, notes, files, links, and updates
- Add admin and customer views

Why this matters:
This transforms the customer portal into a real delivery experience.

### 14. Milestone billing and invoicing

- Add staged payments
- Add invoice records
- Add due dates and paid/unpaid state
- Connect to Stripe flows

Why this matters:
This is a major business feature and pairs naturally with proposals and project workspaces.

### 15. Outbound integrations and automations

- Slack notifications
- Discord notifications
- Google Sheets sync
- Notion sync
- webhook subscriptions for inquiry/payment/customer events

Why this matters:
This makes the platform much more extensible for real operational use.

### 16. Redis-backed cache and background jobs

- Replace or augment Prisma-backed cache for high-throughput workloads
- Add Redis for:
  - low-latency cache
  - rate-limit state
  - queue support
- Add background jobs for:
  - AI summary generation
  - email sends
  - notification fanout
  - webhook retries
  - analytics rollups

Why this matters:
This is the right long-term scalability path, but it is more infrastructure-heavy than the current stage requires.

## Suggested Build Order

If the goal is maximum impact with strong product momentum, build in this order:

1. TanStack Query setup across apps
2. Backend cache expansion and invalidation
3. AI inquiry triage
4. AI content assistant
5. AI analytics summaries
6. Customer support assistant upgrade
7. Proposal generator
8. CRM pipeline
9. Customer project workspace
10. Milestone billing and invoicing

## Recommended First Milestone

If starting now, the best milestone is:

### Milestone 1: Foundations + First AI Workflow

- Add TanStack Query
- Improve backend caching
- Refactor chatbot AI helpers into service modules
- Build AI inquiry triage
- Surface triage results in admin inquiries

This gives you:

- cleaner data flow
- better performance
- better frontend developer experience
- the first truly impactful AI workflow in the product

## Notes

- Do not introduce Redux as the first state-management upgrade
- Use React Context for auth/theme and TanStack Query for server state
- Introduce Zustand later only if you discover real shared client-state problems
- Keep AI logic in dedicated backend service modules rather than inside controllers
