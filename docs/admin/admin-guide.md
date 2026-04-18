# Admin System Documentation

This document covers every section of the admin panel — what it does, how to use it, and how it fits into the overall system.

---

## Access

The admin panel lives at `/admin`. It requires authentication with a valid admin account.

**Default credentials (change immediately after first login)**

| Field | Value |
|---|---|
| Email | `admin@portfolio.dev` |
| Password | `Admin@123456` |

Login is handled by a JWT-based flow. The token is stored in memory via React Context and refreshed by calling `/api/auth/me` on page load.

---

## Admin Login Flow

```
User visits /admin
        │
        ▼
  Not authenticated → redirect to /admin/login
        │
        ▼
  User submits email + password
        │
        ▼
  POST /api/auth/login
        │
    ┌───┴───┐
   fail    success
    │         │
    ▼         ▼
  Error    JWT stored in AuthContext
  shown    User redirected to /admin/dashboard
```

---

## Dashboard

**Route:** `/admin`

Shows an at-a-glance overview of the portfolio:

- Total visitors, page views, and projects
- Recent analytics summary (last 30 days)
- Pending inquiry count
- Latest blog posts and their view counts

---

## Blog Management

**Route:** `/admin/blog`

Create, edit, and delete blog posts.

| Field | Description |
|---|---|
| Title | Post title — used in `<title>` and OG tags |
| Slug | URL identifier — auto-suggested, must be unique |
| Excerpt | Short description for the post listing card |
| Content | Full post body in Markdown |
| Tags | Comma-separated tag list |
| Cover Image | URL to cover image |
| Reading Time | Auto-calculated from word count |
| Published | Toggle to make post visible publicly |

Every save creates a `ContentVersion` snapshot. Use the **Version History** button to restore a previous state.

### Content Creation Flow

```
Admin navigates to /admin/blog
        │
        ▼
  Clicks "New Post"
        │
        ▼
  Fills form fields
        │
        ▼
  Clicks Save (unpublished by default)
        │
        ▼
  POST /api/blog
  ContentVersion snapshot created
        │
        ▼
  Admin reviews preview
        │
        ▼
  Toggles Published → PUT /api/blog/:id
  Post appears on /blog
```

---

## Projects Management

**Route:** `/admin/projects`

Full CRUD for portfolio projects.

| Field | Description |
|---|---|
| Title | Project name |
| Description | Short description (used in cards) |
| Long Description | Full Markdown description |
| Tech Stack | Array of technology labels |
| GitHub URL | Link to repository |
| Live URL | Link to live site or demo |
| Image URL | Cover image |
| Featured | Pin to top of the projects list |
| Order | Display order (lower = higher) |

Changes are versioned. Project click analytics are tracked per-project.

---

## Services Management

**Route:** `/admin/services`

Manage the service tiers shown on the `/services` page.

| Field | Description |
|---|---|
| Title | Tier name (e.g. "Starter", "Professional") |
| Description | What this tier offers |
| Features | Bullet list of included features |
| Price | Display price (e.g. "$2,500") |
| Price Note | Optional note (e.g. "per month") |
| Tier | Internal tier identifier |
| Popular | Highlights this card visually |
| CTA Label | Button text (default: "Get Started") |
| Order | Display order |

---

## Testimonials Management

**Route:** `/admin/testimonials`

Add and manage client testimonials.

| Field | Description |
|---|---|
| Name | Client full name |
| Role | Their job title |
| Company | Company name |
| Content | The quote text |
| Avatar URL | Photo URL |
| LinkedIn URL | Optional profile link |
| Rating | Star rating (1–5) |
| Featured | Highlight this testimonial |
| Order | Display order |

---

## Resume Management

**Route:** `/admin/resume`

Upload resume PDFs and control which version is active.

- Multiple versions can be stored.
- Only one can be marked `isActive` at a time.
- Download count is tracked per file.
- The active resume is served at the public `/resume` page.

---

## Inquiries

**Route:** `/admin/inquiries`

All contact form submissions land here.

Each inquiry has a `status`:

| Status | Meaning |
|---|---|
| `UNREAD` | New, not yet viewed |
| `READ` | Opened by admin |
| `REPLIED` | Response sent |
| `ARCHIVED` | Dismissed / closed |

Admins can update the status, view message content, and filter by status.

---

## Analytics Dashboard

**Route:** `/admin/analytics`

Overview of visitor activity.

**Summary stats:**
- Total unique visitors
- Total page views
- Average pages per visitor
- Most visited pages
- Top referrers

**Blog analytics:**
- Views per post
- Read-through rates (from BLOG_SCROLL data)
- Tag popularity

**Project analytics:**
- Click counts per project
- GitHub vs demo link click ratio

**Visitor insights:**
- Country distribution
- Browser and OS breakdown
- Mobile vs desktop ratio
- Traffic over time

---

## Session Analytics

**Route:** `/admin/analytics/sessions`

A high-level view of individual visitor sessions.

### Session Card
Each session is displayed as a card showing:

- Location, browser, and relative time
- Engagement level: **High / Medium / Low** (scored by action weights)
- Quick stats: pages visited, event count, duration
- Highlighted key actions (inquiry sent, resume downloaded, GitHub clicked, etc.)

### Engagement Scoring

Each event type is weighted:

| Event | Weight |
|---|---|
| INQUIRY_SUBMIT | 10 |
| RESUME_DOWNLOAD | 8 |
| SERVICE_INQUIRY_OPEN | 6 |
| PROJECT_GITHUB_CLICK | 5 |
| PROJECT_DEMO_CLICK | 5 |
| BLOG_SCROLL | 4 |
| BLOG_VIEW | 3 |
| PROJECT_VIEW | 3 |
| PAGE_VIEW | 1 |

A score ≥ 20 = High, ≥ 8 = Medium, otherwise Low.

### Filters
Admins can filter the list by: All, High Engagement, Sent Inquiry, Downloaded Resume.

### Session Detail
Clicking a card opens the full session view with:
- Stats row (duration, pages, events, score, country, browser)
- Key Actions panel (only impactful events)
- Content Viewed (which blog posts and projects were seen)
- Pages Visited (clean ordered list)
- Full Event Timeline with readable labels, content names, scroll data

### Session Analysis Workflow

```
Admin opens /admin/analytics/sessions
        │
        ▼
  Scans session cards for high engagement or inquiry badges
        │
        ▼
  Applies filter → e.g. "Sent Inquiry"
        │
        ▼
  Clicks session card
        │
        ▼
  Reviews Key Actions panel
  (resume download, GitHub visit, inquiry submitted)
        │
        ▼
  Checks "Content Viewed" for which posts/projects attracted them
        │
        ▼
  Reviews Full Timeline for complete picture
        │
        ▼
  Navigates back to list → reviews next session
```

---

## Insights Panel

**Route:** `/admin/insights`

Real-time active visitor count and auto-generated insights, including navigation flow analysis (which pages lead visitors to contact or download).

---

## Feature Flags

**Route:** `/admin/flags`

Dynamic toggles for features without requiring a deploy.

| Flag key | Controls |
|---|---|
| `blog_visible` | Hides/shows blog section |
| `projects_visible` | Hides/shows projects |
| `testimonials_visible` | Hides/shows testimonials |
| `services_visible` | Hides/shows services |
| `resume_download` | Enables/disables resume download button |
| `analytics_enabled` | Enables/disables all analytics collection |
| `realtime_analytics` | Enables/disables active visitor presence tracking |
| `content_versioning` | Enables/disables content version snapshots |
| `api_logging` | Enables/disables API request logging |
| `caching_enabled` | Enables/disables response cache |
| `maintenance_mode` | Shows maintenance banner to all visitors |
| `inquiry_form` | Enables/disables contact form |

---

## Developer Diagnostics

**Route:** `/admin/diagnostics`

API health and developer tools.

- **API Stats:** total requests, error rate, average response time, slowest endpoints
- **Error Log:** recent 4xx/5xx responses
- **Event Log:** last N analytics events for real-time debugging

---

## Settings

**Route:** `/admin/settings`

Change the admin account password.

---

## Full Schema — Admin & Content Tables

```
┌──────────┐       ┌──────────────┐       ┌──────────────┐
│   User   │       │   BlogPost   │       │   Project    │
│──────────│       │──────────────│       │──────────────│
│ id       │       │ id           │       │ id           │
│ email    │       │ title        │       │ title        │
│ password │       │ slug (uniq)  │       │ description  │
│ name     │       │ content (MD) │       │ techStack[]  │
│ role     │       │ tags[]       │       │ githubUrl    │
└──────────┘       │ published    │       │ liveUrl      │
                   │ views        │       │ featured     │
                   │ readingTime  │       │ order        │
                   └──────────────┘       └──────┬───────┘
                                                 │ 1 ─── *
                                          ┌──────▼───────┐
┌──────────────┐   ┌──────────────┐       │ ProjectClick │
│  FeatureFlag │   │ContentVersion│       │──────────────│
│──────────────│   │──────────────│       │ id           │
│ id           │   │ id           │       │ projectId FK │
│ key (uniq)   │   │ contentType  │       │ createdAt    │
│ name         │   │ contentId    │       └──────────────┘
│ enabled      │   │ version      │
│ category     │   │ snapshot JSON│
│ metadata JSON│   │ changedBy    │
└──────────────┘   └──────────────┘

┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐
│ Service  │  │ Testimonial  │  │   Inquiry    │  │   Resume   │
│──────────│  │──────────────│  │──────────────│  │────────────│
│ id       │  │ id           │  │ id           │  │ id         │
│ title    │  │ name         │  │ name, email  │  │ fileName   │
│ features │  │ company      │  │ message      │  │ fileUrl    │
│ price    │  │ content      │  │ status       │  │ isActive   │
│ tier     │  │ rating       │  │ ipAddress    │  │ version    │
│ popular  │  │ featured     │  └──────────────┘  └────────────┘
└──────────┘  └──────────────┘

┌──────────┐  ┌──────────┐  ┌────────────┐
│  ApiLog  │  │CacheEntry│  │ActiveVistor│
│──────────│  │──────────│  │────────────│
│ method   │  │ key (PK) │  │ sessionId  │
│ path     │  │ value    │  │ currentPage│
│ statusCd │  │ expiresAt│  │ lastPing   │
│ durationMs│ └──────────┘  └────────────┘
│ errorMsg │
└──────────┘
```

---

## Use Cases

### UC-A1: Admin Creates a Blog Post

1. Admin navigates to `/admin/blog`.
2. Clicks "New Post" button.
3. Fills in title, slug, content (Markdown), tags, excerpt.
4. Saves as draft (Published = off).
5. Previews the post at `/blog/:slug`.
6. Toggles Published to make it live.
7. Server creates `ContentVersion` snapshot on every save.

### UC-A2: Admin Analyzes Visitor Sessions

1. Opens `/admin/analytics/sessions`.
2. Scans session cards for inquiry or resume badges.
3. Applies "Sent Inquiry" filter.
4. Clicks a high-engagement card.
5. Reviews Key Actions (resume download → GitHub click → inquiry).
6. Identifies which blog post or project led them there from Content Viewed.
7. Navigates back and checks next session.

### UC-A3: Admin Reviews Analytics

1. Opens `/admin/analytics`.
2. Checks total visitors and trend.
3. Identifies most-viewed blog posts.
4. Sees project click breakdown.
5. Checks country distribution and device split.

### UC-A4: Admin Toggles a Feature

1. Opens `/admin/flags`.
2. Finds `maintenance_mode`.
3. Toggles it on.
4. Public site shows maintenance message without a deploy.
5. Toggles back off when maintenance is complete.

### UC-A5: Admin Updates Profile

1. Opens `/admin/profile`.
2. Types in input fields — focus is maintained between keystrokes.
3. Updates bio, social links, skills, stats.
4. Clicks Save — server updates Profile row and creates ContentVersion.

### UC-A6: Admin Manages Resume

1. Opens `/admin/resume`.
2. Uploads a new PDF.
3. Sets it as active.
4. Previous version is preserved but deactivated.
5. Public `/resume` page now serves the new file.
