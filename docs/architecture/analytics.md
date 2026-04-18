# Analytics System

## Design Philosophy

The analytics system tracks visitor behavior without third-party services and without relying on browser cookies. Every visitor gets a session ID generated client-side. Events are sent to the application's own API and stored in PostgreSQL.

**Privacy:** No personal information is required. IP addresses are stored only for geo-lookup and immediately discarded from memory. Browser fingerprinting is not used.

---

## Event Architecture

### Event Flow

```
Visitor action (page view, click, download)
       │
       ▼
useTracker hook or named tracker function
       │
       ▼ POST /api/analytics/track
analytics.controller.ts → analytics.service.ts
       │
       ├── Upsert Visitor record (by sessionId)
       ├── Log AnalyticsEvent (type + metadata)
       ├── Update or create VisitorSession
       └── Log ContentEvent (for content-specific events)
```

### Event Types

**AnalyticsEvent types** (high-level):

| Type | Fired When |
|---|---|
| `PAGE_VIEW` | Route change (non-admin) |
| `RESUME_DOWNLOAD` | Resume download initiated |
| `PROJECT_CLICK` | Project card GitHub/demo clicked |
| `CONTACT_SUBMIT` | Inquiry form submitted |
| `BLOG_READ` | Blog post opened |
| `SERVICE_INQUIRY` | Service selected from pricing |
| `EXTERNAL_LINK` | External link clicked |

**ContentEventType values** (granular):

| Type | Fired When |
|---|---|
| `PAGE_VIEW` | Any page visited |
| `BLOG_VIEW` | Blog post opened |
| `BLOG_SCROLL` | User scrolls past 50% of post |
| `PROJECT_VIEW` | Project card expanded/visited |
| `PROJECT_GITHUB_CLICK` | GitHub link clicked on project |
| `PROJECT_DEMO_CLICK` | Live demo link clicked |
| `RESUME_PAGE_VISIT` | Resume page opened |
| `RESUME_DOWNLOAD` | Download button clicked |
| `SERVICE_PAGE_VISIT` | Services page loaded |
| `SERVICE_INQUIRY_OPEN` | Inquiry form scroll initiated |
| `INQUIRY_SUBMIT` | Inquiry form successfully submitted |
| `SESSION_END` | User navigates away / closes tab |

---

## Session Tracking

Each browser session generates a random `sessionId` (stored in `sessionStorage`). This means:
- Same user across tabs = same session (as long as tab is open)
- Page refresh = same session (sessionStorage persists)
- New tab = new session
- Browser close = new session next visit

The server creates one `VisitorSession` per `sessionId`. As events arrive:
- `totalEvents` increments
- `navigationPath` (array) is appended with each new page
- `pageCount` increments on new pages
- `sessionEnd` and `totalDuration` are set when `SESSION_END` arrives

---

## Deduplication (StrictMode Guard)

React 18 StrictMode in development mounts → unmounts → remounts effects. Without deduplication, every navigation would fire 2x events.

Two module-level Sets handle this:

```typescript
const _trackedPaths  = new Set<string>();  // PAGE_VIEW dedup per path
const _viewedSlugs   = new Set<string>();  // BLOG_VIEW dedup per slug
```

Each Set entry is cleaned up on effect cleanup, so navigating away and back re-fires correctly.

---

## Sessions Viewer (Admin)

The Sessions Viewer (`/admin/analytics/sessions`) displays sessions with an **engagement scoring system**:

| Event | Score |
|---|---|
| INQUIRY_SUBMIT | 10 |
| RESUME_DOWNLOAD | 8 |
| PROJECT_DEMO_CLICK | 6 |
| PROJECT_GITHUB_CLICK | 5 |
| BLOG_SCROLL | 3 |
| BLOG_VIEW / PROJECT_VIEW | 2 |
| SERVICE_PAGE_VISIT | 1 |

Sessions are classified as:
- **High** (≥10) — converted or highly engaged visitors
- **Medium** (4–9) — engaged but didn't convert
- **Low** (<4) — casual browser

---

## Smart Insights (Admin)

`/admin/insights` auto-generates human-readable insights from behavioral data:

Examples:
- "📈 Traffic is up 34% compared to last week"
- "🔥 Your blog post 'X' is trending with 120 views this week"
- "💼 3 new unread inquiries need your attention"
- "⬇ Resume downloads dropped 50% this period"

Insights are categorized as `positive`, `negative`, or `info` and displayed with color-coded cards.

---

## Navigation Flow Analysis

The `navFlows` endpoint analyzes `navigationPath` arrays from VisitorSessions to identify:
- **Top flows** — most common 2-page sequences (e.g., Home → Projects → Services)
- **Top entry pages** — where visitors start
- **Top exit pages** — where visitors leave

This is analogous to a simplified funnel analysis.

---

## Analytics API Reference

| Endpoint | Description |
|---|---|
| `POST /api/analytics/track` | Log an event |
| `GET /api/analytics/summary?days=30` | Overview metrics |
| `GET /api/analytics/blogs?days=30` | Blog engagement stats |
| `GET /api/analytics/projects?days=30` | Project interaction stats |
| `GET /api/analytics/visitors?days=30` | Session + device stats |
| `GET /api/analytics/active` | Currently active visitors |
| `GET /api/analytics/sessions?page=1` | Paginated session list |
| `GET /api/analytics/sessions/:id` | Single session detail |
| `GET /api/analytics/insights?days=30` | Smart insights |
| `GET /api/analytics/flows?days=30` | Navigation flow analysis |

---

## Admin Pollution Guard

Events from admin routes (`/admin/*`) are filtered out in `useTracker`:

```typescript
if (pathname.startsWith('/admin')) return;
```

This ensures admin visits don't inflate visitor metrics.
