# Analytics System

## Overview

The analytics system is first-party, application-owned analytics. It does not rely on a third-party SaaS dashboard and is tightly integrated into the public experience, admin insights, and session viewer.

Key traits:

- event tracking is sent to the platform's own API
- analytics data is stored in PostgreSQL
- page and content interactions are modeled separately
- active visitor presence is supported
- admin diagnostics and smart insights build on top of the same data model

## Data Model

The analytics subsystem spans these models:

- `Visitor`
- `PageView`
- `AnalyticsEvent`
- `VisitorSession`
- `ContentEvent`
- `ActiveVisitor`

This split matters:

- `AnalyticsEvent` holds higher-level event types
- `ContentEvent` captures richer content-aware interactions
- `VisitorSession` makes navigation and engagement analysis possible
- `ActiveVisitor` powers near-real-time presence summaries

## Event Flow

```text
User interaction
  -> tracking hook / explicit tracker function
  -> POST /api/analytics/track
  -> analytics.controller.ts
  -> analytics.service.ts
       -> upsert visitor
       -> update visitor session
       -> record page view
       -> record analytics event
       -> record content event
       -> update presence when enabled
```

## Current Event Types

### `AnalyticsEvent` enum

The current enum includes:

- `PAGE_VIEW`
- `BUTTON_CLICK`
- `LINK_CLICK`
- `RESUME_DOWNLOAD`
- `PROJECT_CLICK`
- `CONTACT_SUBMIT`
- `BLOG_READ`
- `SERVICE_INQUIRY`
- `EXTERNAL_LINK`

### `ContentEventType` enum

The current granular content event types include:

- `PAGE_VIEW`
- `BLOG_VIEW`
- `BLOG_SCROLL`
- `BLOG_LINK_CLICK`
- `BLOG_RELATED_CLICK`
- `PROJECT_VIEW`
- `PROJECT_GITHUB_CLICK`
- `PROJECT_DEMO_CLICK`
- `PROJECT_IMAGE_VIEW`
- `RESUME_PAGE_VISIT`
- `RESUME_DOWNLOAD`
- `SERVICE_PAGE_VISIT`
- `SERVICE_INQUIRY_OPEN`
- `INQUIRY_SUBMIT`
- `EXTERNAL_LINK`
- `BUTTON_CLICK`
- `SESSION_END`

## Session Tracking

The system relies on client-generated session identifiers and server-side session records.

Current behavior:

- session ID stored in `sessionStorage`
- device ID stored in `localStorage`
- visitor records updated as requests come in
- visitor sessions track:
  - entry page
  - exit page
  - navigation path
  - page count
  - total events
  - duration

This is what makes the sessions viewer, nav flows, and engagement scoring possible.

## Real-Time Presence

When the `realtime_analytics` feature flag is enabled:

- the backend updates `ActiveVisitor` entries
- admin can see active visitor counts
- admin can see top current pages and countries
- admin can inspect the currently active session list

This is a meaningful operational feature already implemented in the product.

## Current Analytics Endpoints

| Endpoint | Purpose |
| --- | --- |
| `POST /api/analytics/track` | Record visitor and content events |
| `GET /api/analytics/summary` | High-level summary metrics |
| `GET /api/analytics/blogs` | Blog-specific analytics |
| `GET /api/analytics/projects` | Project-specific analytics |
| `GET /api/analytics/visitors` | Device, browser, session, and geography insights |
| `GET /api/analytics/active` | Active visitor summary |
| `GET /api/analytics/sessions` | Session list |
| `GET /api/analytics/sessions/:sessionId` | Session detail timeline |
| `GET /api/analytics/insights` | Smart insights |
| `GET /api/analytics/flows` | Navigation flow summaries |

## Smart Insights

The current smart insights implementation is important to describe correctly.

It currently:

- compares visitor periods
- identifies top blog and project content
- finds top audience geography and device category
- counts resume downloads
- counts inquiry submits
- formats those into color-coded insight cards

It does **not** currently use an LLM.

That means the phrase “AI-generated insights” in older docs was too strong for the actual implementation. The more accurate description is:

- rule-based or deterministic insights derived from analytics data

This distinction matters because true AI analytics summaries are still a strong future feature.

## Navigation Flows

The current `navFlows` implementation:

- reads `navigationPath` arrays from `VisitorSession`
- counts two-step transitions
- surfaces:
  - top flows
  - top entry pages
  - top exit pages

This gives the admin app a lightweight funnel/journey lens without a full BI platform.

## Caching

Analytics endpoints are already among the best uses of the backend cache service.

Current cache usage includes:

- summary metrics
- blog analytics
- project analytics
- visitor insights

Short TTL caching is appropriate here because:

- analytics aggregations are relatively expensive
- data does not need sub-second freshness for most admin views
- the same queries are repeatedly requested in the dashboard

## Accuracy Notes

When reading older docs or UI labels, keep these implementation notes in mind:

- analytics is first-party and database-backed
- active visitors are real but lightweight, not a full WebSocket real-time system
- smart insights are currently deterministic
- the next major upgrade would be true AI analytics summaries layered on top of the current data

## Recommended Next Step

The strongest next analytics feature for this codebase is:

- AI analytics summaries built from the existing summary, flows, and session datasets

That would give the current analytics system a more decision-oriented layer without replacing the underlying event model.
