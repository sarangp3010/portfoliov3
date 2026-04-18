# Public Platform Documentation

This document describes the visitor-facing side of Portfolio V3 — what visitors experience, how they interact with content, and how the platform tracks their behavior to provide insights to the site owner.

---

## Features Available to Visitors

### Portfolio Home
The landing page presents the owner's name, title, short bio, key statistics (years of experience, project count, client count), skills, and availability status. Featured projects are displayed here with links to GitHub and live demos.

### Blog
Visitors can browse a paginated list of published blog posts. Each card shows the post title, excerpt, tags, reading time, view count, and publication date. Clicking opens the full article with rendered Markdown content including code blocks, headings, tables, and inline formatting.

### Services
A tiered pricing page lists the services offered, descriptions, included features, and call-to-action buttons. Visitors can open an inquiry modal directly from a service card.

### Testimonials
Client testimonials with avatar, name, role, company, rating, and quote. Featured testimonials are displayed prominently.

### Resume
Displays the currently active resume file and provides a download button. Downloads are tracked as analytics events.

### Contact / Inquiry
An inquiry form is embedded throughout the site. Submissions are stored in the database and visible in the admin panel.

---

## Visitor Interaction Flows

### Blog Interaction Flow

```
Visitor arrives at site
        │
        ▼
  Browses /blog list
        │
        ├── Clicks tag filter
        │
        ▼
  Selects a post → /blog/:slug
        │
        ├── BLOG_VIEW tracked
        ├── Scroll depth measured continuously
        ├── Time-on-page measured
        │
        ├── Clicks internal link → BLOG_LINK_CLICK
        │
        └── Leaves page → BLOG_SCROLL event fired
                         (scroll depth + duration sent)
```

### Project Interaction Flow

```
Visitor views projects section on Home
        │
        ▼
  Hovers / sees project card
        │
        ├── Clicks card title → PROJECT_VIEW
        │
        ├── Clicks GitHub button → PROJECT_GITHUB_CLICK
        │         (also fires legacy PROJECT_CLICK)
        │
        └── Clicks Live Demo → PROJECT_DEMO_CLICK
                    (also fires legacy EXTERNAL_LINK)
```

### Inquiry / Contact Flow

```
Visitor sees CTA (services, home, or blog)
        │
        ▼
  Opens inquiry modal → SERVICE_INQUIRY_OPEN
        │
        ▼
  Fills form fields
        │
        ▼
  Submits form → INQUIRY_SUBMIT + CONTACT_SUBMIT (legacy)
        │
        ▼
  Submission stored in database
  Admin receives notification email
```

### Resume Download Flow

```
Visitor arrives at /resume → RESUME_PAGE_VISIT
        │
        ▼
  Views resume preview
        │
        ▼
  Clicks Download → RESUME_DOWNLOAD event
                  → File served from uploads directory
```

---

## Session Tracking

Every visitor is tracked as a **Visitor** with a unique session ID stored in `sessionStorage`. The session ID resets when the browser tab is closed. A separate device ID in `localStorage` persists across tabs and sessions.

### Session Lifecycle

```
Browser opens site
        │
        ▼
  getSessionId() — creates or restores _sid from sessionStorage
  getDeviceId()  — creates or restores _did from localStorage
        │
        ▼
  First PAGE_VIEW sent to /api/analytics/track
        │
        ▼
  Server: upserts Visitor row (sessionId unique index)
          creates or updates VisitorSession
          records ContentEvent (PAGE_VIEW)
          records PageView
        │
        ▼
  Visitor navigates → next PAGE_VIEW on route change
        │
        ▼
  Blog post visited:
    BLOG_VIEW (on mount)
    BLOG_SCROLL (on unmount — scroll depth + duration)
        │
        ▼
  Visitor closes tab / navigates away
    SESSION_END event (optional, fires on beforeunload)
```

### VisitorSession construction

The server groups events into sessions using a 30-minute inactivity window. Each `VisitorSession` row accumulates:

- `entryPage` — first page seen
- `exitPage` — last page seen
- `navigationPath` — ordered array of all pages visited
- `totalEvents` — count of ContentEvent rows
- `pageCount` — count of distinct page URLs
- `totalDuration` — seconds from first to last event

---

## Analytics Events Reference

| Event | Trigger | Data captured |
|---|---|---|
| `PAGE_VIEW` | Every route change | page, title |
| `BLOG_VIEW` | Blog post mounted | slug, title |
| `BLOG_SCROLL` | Blog post unmounted | scroll depth %, duration seconds |
| `BLOG_LINK_CLICK` | Internal blog link clicked | slug, target URL |
| `PROJECT_VIEW` | Project card title clicked | projectId, title |
| `PROJECT_GITHUB_CLICK` | GitHub button clicked | projectId, URL |
| `PROJECT_DEMO_CLICK` | Live demo button clicked | projectId, URL |
| `RESUME_PAGE_VISIT` | Resume page mounted | — |
| `RESUME_DOWNLOAD` | Download button clicked | — |
| `SERVICE_PAGE_VISIT` | Services page mounted | — |
| `SERVICE_INQUIRY_OPEN` | Inquiry modal opened | service title |
| `INQUIRY_SUBMIT` | Contact form submitted | — |
| `EXTERNAL_LINK` | Any external link clicked | href |
| `BUTTON_CLICK` | Generic button interaction | label, page |
| `SESSION_END` | beforeunload or explicit end | — |

---

## Database Schema — Visitor & Analytics Entities

```
┌──────────────┐         ┌──────────────────┐
│   Visitor    │ 1 ─── * │    PageView       │
│──────────────│         │──────────────────│
│ id (PK)      │         │ id               │
│ sessionId    │         │ visitorId (FK)   │
│ deviceId     │         │ page             │
│ ip           │         │ title            │
│ country      │         │ duration         │
│ browser      │         │ createdAt        │
│ isMobile     │         └──────────────────┘
│ referrer     │
│ firstSeen    │         ┌──────────────────┐
│ lastSeen     │ 1 ─── * │  AnalyticsEvent  │
└──────┬───────┘         │──────────────────│
       │                 │ id               │
       │ 1 ─── *         │ visitorId (FK)   │
       │                 │ type (EventType) │
       ▼                 │ page, target     │
┌──────────────┐         │ metadata (JSONB) │
│VisitorSession│         └──────────────────┘
│──────────────│
│ id (PK)      │         ┌──────────────────┐
│ visitorId FK │         │  ContentEvent    │
│ entryPage    │ 1 ─── * │──────────────────│
│ exitPage     │         │ id               │
│ sessionStart │         │ visitorId (FK)   │
│ sessionEnd   │         │ sessionId (FK?)  │ ← nullable
│ totalDuration│         │ eventType        │
│ totalEvents  │         │ contentType      │
│ pageCount    │         │ contentId        │
│ navigationPth│         │ contentTitle     │
└──────────────┘         │ metadata (JSONB) │
                         └──────────────────┘
```

---

## Use Cases

### UC-1: Visitor Reads a Blog Post

1. Visitor navigates to `/blog`.
2. `PAGE_VIEW` for `/blog` fires.
3. Visitor clicks a post card.
4. `PAGE_VIEW` for `/blog/:slug` fires (from core tracker).
5. `BLOG_VIEW` fires (from `useBlogTracker`).
6. Scroll events accumulate in memory.
7. Visitor leaves page → `BLOG_SCROLL` fires with depth and duration.

### UC-2: Visitor Views a Project

1. Visitor on home page scrolls to projects section.
2. Visitor clicks project title → `PROJECT_VIEW` fires.
3. Visitor clicks GitHub icon → `PROJECT_GITHUB_CLICK` fires.
4. Visitor clicks live demo → `PROJECT_DEMO_CLICK` fires.

### UC-3: Visitor Submits an Inquiry

1. Visitor clicks any "Work Together" button.
2. Inquiry modal opens → `SERVICE_INQUIRY_OPEN` fires.
3. Visitor fills the form and submits.
4. `INQUIRY_SUBMIT` fires client-side.
5. Server stores `Inquiry` row, sends email notification to admin.
6. Visitor receives confirmation message.

### UC-4: Analytics Session Lifecycle

1. Visitor opens browser — new `sessionId` generated.
2. First API call creates `Visitor` and `VisitorSession` rows.
3. Each page and content event appends to `ContentEvent` and updates `VisitorSession`.
4. Admin views Sessions dashboard → sees summary card with engagement score, key actions, pages visited.
5. Admin clicks session → full event timeline with readable labels and metadata.
