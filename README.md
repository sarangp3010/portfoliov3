# Profile

A **production-grade full-stack developer portfolio platform** — a complete SaaS application with three frontend apps (public site, admin dashboard, customer portal), Stripe payments, advanced analytics, dynamic theme management, PDF generation, SMS notifications, social OAuth, customer session management, and an **AI-powered chatbot assistant**.

## Applications

| App | URL | Purpose |
|-----|-----|---------|
| **Public** | `public.example.com` | Developer portfolio website |
| **Admin** | `admin.example.com` | Management dashboard |
| **Customer Portal** | `customer.example.com` | Client self-service portal |
| **API** | `api.example.com` | Shared REST API |

# portfoliov3

---

## Overview

Portfolio V3 is a self-hosted portfolio-as-a-service application. A developer deploys it once and manages everything — profile, projects, blog, services, testimonials, client payments — through a secure admin dashboard. Visitors get a fast, animated, fully responsive frontend. The developer gets deep analytics on every interaction.

**Stack:** React 18 + TypeScript + Framer Motion (frontend) · Node.js + Express + TypeScript (backend) · PostgreSQL + Prisma (database) · Stripe (payments) · Twilio SMS · Docker (deployment)

---

## Architecture

```
/
├── apps/
│   ├── public/      # Public developer website (Vite + React, :3000)
│   │   └── src/
│   │       ├── pages/public/      # Visitor-facing pages
│   │       ├── components/        # Layout, navbar, footer
│   │       └── hooks/             # Analytics tracking
│   ├── admin/       # Admin dashboard (Vite + React, :3001)
│   │   └── src/
│   │       ├── pages/admin/       # All admin pages
│   │       └── components/admin/  # AdminLayout, sidebar
│   └── customer/    # Customer portal (Vite + React, :3002)
│       └── src/
│           ├── pages/customer/    # Login, Dashboard, Services, Payments…
│           ├── context/           # Customer AuthContext
│           └── api/               # Customer API client
├── server/          # Node.js + Express API (:5000)
│   └── src/
│       ├── controllers/           # Route handlers
│       ├── services/              # Business logic (payments, customer, SMS…)
│       ├── middleware/            # Auth (admin + customer), error handling
│       ├── routes/                # All API routes
│       └── config/                # Prisma, env config
│   └── prisma/
│       ├── schema.prisma          # Full database schema
│       ├── migrations/            # SQL migration files (0001–0004)
│       └── seed.ts                # Demo data seeder
├── nginx/           # Subdomain reverse proxy config
└── docs/            # Engineering documentation
```

---

## Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework with concurrent features |
| TypeScript | Type safety across all components |
| Vite 5 | Build tool with HMR |
| Tailwind CSS 3 | Utility-first styling + custom design system |
| Framer Motion 11 | Page transitions, scroll animations, hover effects |
| React Router 6 | Client-side routing with lazy loading |
| Recharts | Data visualization (area, bar, pie charts) |
| Axios | HTTP client with interceptors |

### Backend
| Technology | Purpose |
|---|---|
| Node.js 20 | Runtime |
| Express 4 | HTTP server |
| TypeScript | End-to-end type safety |
| Prisma 5 | ORM + migrations |
| PostgreSQL | Primary database (19 tables) |
| JWT | Stateless authentication |
| Stripe SDK 16 | Payment processing |
| Nodemailer | Email notifications |
| Winston | Structured logging |

---

## Feature List

### Public Portfolio
- Hero page with animated intro, stats, featured projects
- Projects gallery with tech stack, GitHub/demo links, click tracking
- Blog with markdown, tag filtering, reading time, scroll tracking
- Services & Pricing with tiered packages and inline inquiry form
- Testimonials with star ratings
- Resume with print-ready layout and PDF export
- Payment success/cancel pages with Stripe session polling

### Stripe Payment System
- Service payments: inquiry → Stripe Checkout → confirmation
- Custom amount and donation flows
- Webhook processing with idempotency (prevents double-processing)
- Payment records stored in PostgreSQL with full audit trail
- Receipt PDF download for every transaction
- Revenue analytics: daily trends, type breakdown, average order value

### Admin Dashboard (15 Pages)
- **Dashboard** — stats, unread inquiries, quick links
- **Analytics** — 5-tab: Overview, Blogs, Projects, Visitors, Revenue
- **Sessions Viewer** — per-session journeys with engagement scoring (High/Medium/Low)
- **Insights Panel** — auto-generated insights + navigation flow analysis
- **Payments Manager** — revenue charts, transaction table, receipt downloads
- **Profile Editor** — live editing with version history rollback
- **Projects Manager** — CRUD, ordering, featured toggle
- **Blog Manager** — rich content, publish/unpublish workflow
- **Services Manager** — tier management with pricing
- **Testimonials Manager** — client testimonial CRUD
- **Resume Manager** — multi-version upload and activation
- **Inquiries Manager** — UNREAD → READ → REPLIED → ARCHIVED workflow
- **Feature Flags** — runtime toggles without redeployment
- **Theme Manager** — live colors, fonts, animations, custom CSS
- **Dev Diagnostics** — API request log, error rates, P95 latency

### Analytics System
- Session fingerprinting (no third-party cookies required)
- Event tracking: page views, clicks, downloads, form submits
- Blog engagement: scroll depth, time on page
- Session journeys: entry page → navigation path → exit page
- Real-time active visitor presence
- Smart auto-generated insights from behavioral data
- Geographic data, device/browser/OS breakdown
- Visual charts: daily trends, country maps, event breakdowns

### PDF Generation (Browser-Native, No Dependencies)
- Resume PDF — professional layout with skills and projects
- Portfolio PDF — full export with projects, blog, services tables
- Payment receipt PDF — per-transaction with itemization
- Analytics report PDF — 7/30/90-day visitor summary

### Theme Management
- Light/dark mode applied globally via CSS variables
- 8 color presets + custom hex color pickers
- Body font + display font selectors
- Border radius: sharp / rounded / pill
- Animation speed: none / slow / normal / fast
- Custom CSS injection
- Live preview before saving

### Responsive & Animated UI
- Mobile-first responsive design
- Framer Motion page transitions
- Scroll-triggered section reveals
- Hover animations on interactive cards
- Animated dashboard stat counters
- Smooth scroll to inquiry from pricing cards

---

## Setup Instructions

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- Stripe account (test keys work)

### 1. Configure Environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
DATABASE_URL="postgresql://portfolio:portfolio@localhost:5432/portfolio"
JWT_SECRET="your-random-32-char-secret"
CLIENT_URL="http://localhost:5173"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 2. Start Database

```bash
docker compose up -d postgres
```

### 3. Install all dependencies

```bash
npm run install:all
```

### 4. Configure environment

```bash
cp .env.example .env   # then fill in DATABASE_URL, JWT_SECRET, Stripe keys
```

### 5. Initialize database

```bash
npm run db:setup       # runs migrations + seeds demo data
```

### 6. Start the entire platform

```bash
npm run dev
```

That's it — all five processes start in parallel (proxy + api + 3 apps).

| URL | Application |
|-----|-------------|
| http://public.localhost:5173 | Public site |
| http://admin.localhost:5173 | Admin dashboard |
| http://customer.localhost:5173 | Customer portal |
| http://api.localhost:5173/health | API health check |

**Default admin:** `admin@portfolio.dev` / `Admin@123456`

> **How it works:** A single proxy process listens on `:5173` and routes each request to the correct internal Vite server based on the subdomain. See [`docs/local-dev-setup.md`](docs/local-dev-setup.md) for full details.

---

## Development Workflow

### Database Changes

**Always create a new migration — never modify `0001_init`.**

```bash
cd server
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name describe_your_change
```

Migration files must run on a completely empty PostgreSQL database.

### Adding a Feature

1. Add Prisma model → `server/prisma/schema.prisma`
2. Create migration → `server/prisma/migrations/000N_name/migration.sql`
3. Business logic → `server/src/services/`
4. HTTP handler → `server/src/controllers/`
5. Register route → `server/src/routes/index.ts`
6. API call → `apps/<app>/src/api/index.ts`
7. TypeScript types → `apps/<app>/src/types/index.ts`
8. React component → `apps/<app>/src/pages/`

---

## Deployment

```bash
# Build and start all services
docker compose up -d --build

# Run migrations (first deploy)
docker compose exec server npm run db:deploy
docker compose exec server npm run db:seed
```

### Stripe Webhook Setup

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/payments/webhook`
3. Events: `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`
4. Copy webhook secret → `STRIPE_WEBHOOK_SECRET`

---

## Database Schema Overview

19 tables across 6 functional groups:

| Group | Tables |
|---|---|
| Content | Profile, Project, BlogPost, Service, Testimonial, Resume, Inquiry |
| Analytics | Visitor, PageView, AnalyticsEvent, ProjectClick, VisitorSession, ContentEvent, ActiveVisitor |
| Payments | Payment, PaymentWebhookEvent |
| System | User, FeatureFlag, ContentVersion, ApiLog, CacheEntry, ThemeSetting |

Full reference: [docs/schema.md](docs/schema.md)

---

## Documentation

| Document | Description |
|---|---|
| [docs/getting-started.md](docs/getting-started.md) | Quick start |
| [docs/schema.md](docs/schema.md) | Database schema reference |
| [docs/migrations.md](docs/migrations.md) | Migration workflow and rules |
| [docs/architecture/system.md](docs/architecture/system.md) | System architecture |
| [docs/architecture/backend.md](docs/architecture/backend.md) | Backend deep-dive |
| [docs/architecture/frontend.md](docs/architecture/frontend.md) | Frontend architecture |
| [docs/architecture/payments.md](docs/architecture/payments.md) | Payment module |
| [docs/architecture/analytics.md](docs/architecture/analytics.md) | Analytics system |
| [docs/public/visitor-guide.md](docs/public/visitor-guide.md) | Public features |
| [docs/admin/admin-guide.md](docs/admin/admin-guide.md) | Admin dashboard |

---

## License

MIT — free to use, fork, and deploy for your own portfolio.
