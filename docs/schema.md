# Database Schema Reference

This document describes every table and enum in the database. The canonical source of truth is `server/prisma/schema.prisma`. This document explains the purpose and relationships of each model.

---

## Tables at a glance

| Table | Purpose |
|---|---|
| `User` | Admin accounts |
| `Profile` | Public portfolio profile (single row) |
| `Project` | Portfolio projects |
| `BlogPost` | Blog articles |
| `Service` | Service offerings and pricing |
| `Testimonial` | Client testimonials |
| `Resume` | Uploaded resume PDFs |
| `Inquiry` | Contact form submissions |
| `Visitor` | Unique visitor sessions |
| `PageView` | Individual page view events |
| `AnalyticsEvent` | Legacy analytics events |
| `ProjectClick` | Project click tracking |
| `VisitorSession` | Grouped visitor journeys |
| `ContentEvent` | Detailed content interaction events |
| `FeatureFlag` | Dynamic feature toggles |
| `ContentVersion` | Version history for editable content |
| `ApiLog` | API request logs for diagnostics |
| `CacheEntry` | Database-backed response cache |
| `ActiveVisitor` | Real-time presence tracking |

---

## Content tables

### `User`
Stores admin accounts. Passwords are hashed with bcrypt.

| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` | cuid |
| `email` | `TEXT` | unique |
| `password` | `TEXT` | bcrypt hash |
| `name` | `TEXT` | display name |
| `role` | `Role` | `ADMIN` or `VIEWER` |

---

### `Profile`
A single-row table holding the public portfolio profile. Only one row should exist.

| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` | cuid |
| `name` | `TEXT` | full name |
| `title` | `TEXT` | job title |
| `bio` | `TEXT` | long bio |
| `bioShort` | `TEXT` | short bio for hero section |
| `skills` | `TEXT[]` | list of skill labels |
| `techStack` | `TEXT[]` | list of tech items |
| `yearsExp` | `INTEGER` | years of experience |
| `available` | `BOOLEAN` | open to work indicator |

---

### `Project`
Portfolio projects shown on the public site.

| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` | cuid |
| `title` | `TEXT` | |
| `description` | `TEXT` | short description |
| `longDesc` | `TEXT?` | full markdown description |
| `techStack` | `TEXT[]` | technologies used |
| `githubUrl` | `TEXT?` | |
| `liveUrl` | `TEXT?` | |
| `featured` | `BOOLEAN` | pinned to the top |
| `order` | `INTEGER` | display order |

---

### `BlogPost`
Blog articles. Only rows with `published = true` are visible publicly.

| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` | cuid |
| `slug` | `TEXT` | unique, URL-safe identifier |
| `title` | `TEXT` | |
| `excerpt` | `TEXT` | preview text |
| `content` | `TEXT` | full markdown content |
| `tags` | `TEXT[]` | |
| `published` | `BOOLEAN` | |
| `readingTime` | `INTEGER` | minutes |
| `views` | `INTEGER` | incremented on each visit |

---

### `Service`, `Testimonial`, `Resume`, `Inquiry`
Standard CMS content. See `schema.prisma` for full column details. `Inquiry` stores contact form submissions and has a `status` field managed through the admin panel.

---

## Analytics tables

Analytics tables are append-only. Records are never updated, only inserted.

### `Visitor`
One row per browser session. Created on first page view and updated on subsequent visits within the same session.

### `PageView`
One row for every page visited. Child of `Visitor`.

### `AnalyticsEvent`
Legacy event table. Stores coarse-grained events via the `EventType` enum. Retained for backwards compatibility with existing data.

### `ProjectClick`
Dedicated click tracking for projects. Child of `Project`.

### `VisitorSession`
Groups related page views into a single session (30-minute inactivity window). Stores the full navigation path as an ordered array of page URLs. Child of `Visitor`.

### `ContentEvent`
Fine-grained event table. Replaces `AnalyticsEvent` for all new tracking. Each row records what happened, on which content, in which session.

**Relationship**: `ContentEvent` → `VisitorSession` (nullable, `SET NULL` on delete).

---

## Platform tables

### `FeatureFlag`
Dynamic toggles managed through the admin panel. The `key` column is the stable identifier used in code (`blog_visible`, `maintenance_mode`, etc.). Default rows are inserted by `0001_init`.

### `ContentVersion`
Every time an admin saves a blog post, project, service, or profile, the previous state is snapshotted here as JSONB. Enables the version history viewer in the admin panel.

### `ApiLog`
Every API request is logged here (fire-and-forget, non-blocking). Used by the developer diagnostics console.

### `CacheEntry`
Stores cached API responses as JSONB with an `expiresAt` timestamp. Expired rows are pruned lazily on access and periodically by the server.

### `ActiveVisitor`
Tracks which visitors are active right now. Updated on every page view. Rows older than 3 minutes are considered stale and are pruned automatically.

---

## Enums

| Enum | Values |
|---|---|
| `Role` | `ADMIN`, `VIEWER` |
| `InquiryStatus` | `UNREAD`, `READ`, `REPLIED`, `ARCHIVED` |
| `EventType` | `PAGE_VIEW`, `BUTTON_CLICK`, `LINK_CLICK`, `RESUME_DOWNLOAD`, `PROJECT_CLICK`, `CONTACT_SUBMIT`, `BLOG_READ`, `SERVICE_INQUIRY`, `EXTERNAL_LINK` |
| `ContentEventType` | `PAGE_VIEW`, `BLOG_VIEW`, `BLOG_SCROLL`, `BLOG_LINK_CLICK`, `BLOG_RELATED_CLICK`, `PROJECT_VIEW`, `PROJECT_GITHUB_CLICK`, `PROJECT_DEMO_CLICK`, `PROJECT_IMAGE_VIEW`, `RESUME_PAGE_VISIT`, `RESUME_DOWNLOAD`, `SERVICE_PAGE_VISIT`, `SERVICE_INQUIRY_OPEN`, `INQUIRY_SUBMIT`, `EXTERNAL_LINK`, `BUTTON_CLICK`, `SESSION_END` |
| `ContentType` | `BLOG`, `PROJECT`, `SERVICE`, `RESUME`, `OTHER` |
| `VersionType` | `BLOG`, `PROJECT`, `SERVICE`, `PROFILE` |

---

## Foreign key relationships

```
Project
  └── ProjectClick  (CASCADE delete)

Visitor
  ├── PageView          (CASCADE delete)
  ├── AnalyticsEvent    (CASCADE delete)
  ├── VisitorSession    (CASCADE delete)
  └── ContentEvent      (CASCADE delete)

VisitorSession
  └── ContentEvent.sessionId  (SET NULL on delete)
```

All analytics data for a visitor is removed when the visitor row is deleted. Session data is preserved when a session is deleted — `ContentEvent.sessionId` is set to null.
