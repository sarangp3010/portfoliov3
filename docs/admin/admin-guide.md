# Admin System Documentation

This document describes the current admin application as implemented in the repository. It is both a feature guide and a system map for the operational side of the platform.

## Access

The admin app is a protected React application served separately from the public site and customer portal.

Current seed credentials:

| Field | Value |
| --- | --- |
| Email | `admin@portfolio.dev` |
| Password | `Admin@123456` |

Important implementation note:

- the admin token is currently stored in `localStorage`
- older docs that described memory-only auth are no longer accurate for the current repo

## Current Admin Areas

The admin app currently includes all of the following pages:

- dashboard
- analytics
- sessions viewer
- insights
- payments
- customers
- email templates
- notifications
- page sections
- profile editor
- blog manager
- projects manager
- services manager
- testimonials manager
- resume manager
- inquiries manager
- feature flags
- developer diagnostics
- theme manager
- settings

This is substantially broader than a content-only dashboard.

## Dashboard

Purpose:

- quick operational summary
- traffic and engagement signal
- recent platform activity

Typical use:

- check current platform health
- see whether inquiries or customer activity needs attention
- jump into deeper analytics or content pages

## Content Management

### Profile Editor

Controls:

- personal bio
- short bio
- skills
- tech stack
- social/profile links
- stats and availability

Why it matters:

- public site content depends on it
- chatbot context depends on it
- exported documents and service positioning depend on it

### Blog Manager

Controls:

- blog CRUD
- publishing state
- excerpts and content
- tags and cover image

Operational notes:

- content versions are supported
- blog analytics depend on blog content IDs and views

### Projects Manager

Controls:

- project CRUD
- featured state
- order
- links and tech stack
- long description for richer explanations

Operational notes:

- long descriptions improve chatbot and project-detail usefulness
- project analytics track engagement and link clicks

### Services Manager

Controls:

- service tiers
- descriptions
- pricing labels
- feature lists
- CTA labels
- order and emphasis

Operational notes:

- this content influences both public conversion and assistant responses
- service records also support payment plan presentation

### Testimonials Manager

Controls:

- testimonial CRUD
- featured state
- ordering
- rating and attribution metadata

### Resume Manager

Controls:

- upload multiple resumes
- activate one current resume
- delete old versions
- observe download count behavior

## Inquiry Management

The inquiry manager is one of the most business-relevant current admin pages.

Current capabilities:

- paginated inquiry listing
- status filter
- view full inquiry content
- update inquiry status
- delete inquiry
- reply via email

Current statuses:

- `UNREAD`
- `READ`
- `REPLIED`
- `ARCHIVED`

Important roadmap note:

- this page is the best insertion point for future AI inquiry triage

## Analytics And Diagnostics

### Analytics Page

Current responsibilities:

- overview stats
- blog analytics
- project analytics
- visitor insights
- time-window filtering

### Sessions Viewer

Current responsibilities:

- inspect individual visitor sessions
- review navigation paths
- identify meaningful actions
- assess engagement

This page is especially useful for understanding inquiry- or resume-related intent.

### Insights Panel

Current responsibilities:

- active visitor summary
- top pages and countries right now
- deterministic smart insights
- top navigation flows
- top entry/exit pages

Important accuracy note:

- the UI language may suggest AI-like insights
- the current implementation is primarily rule-based/deterministic

### Developer Diagnostics

Current responsibilities:

- API request counts
- error rate
- average and p95 duration
- slow requests
- recent errors
- event log visibility

This is already a serious operational feature for a project of this size.

## Payments

The payments manager gives admin-side access to:

- paginated transactions
- payment-source visibility
- analytics by time window
- revenue breakdowns

This page matters because payments already span public and customer flows, and the admin app is the operational control surface for both.

## Customers

The customers page is one of the biggest areas that older docs tended to under-document.

Current capabilities include:

- list customers
- inspect customer records
- toggle active/inactive state
- review active customer sessions
- terminate sessions
- read customer messages
- reply to customer messages

This means the admin app already contains a small customer-ops layer, not just content administration.

## Email Templates

The admin app currently includes a database-backed email template manager.

Capabilities:

- list templates
- create templates
- update templates
- preview rendered templates
- send test emails
- reset system templates

This is important because outgoing email behavior is no longer hardcoded only in source files.

## Notifications

The admin notification center currently supports:

- paginated notification listing
- unread filtering
- unread count
- mark one read
- mark all read

Notifications are shared system infrastructure, but admin has its own scoped recipient identity and UI.

## Page Sections

This is another major area that should now be considered a first-class feature.

Current capabilities:

- list configurable pages
- seed defaults on first load
- create sections
- edit content/style/animation metadata
- reorder sections
- toggle visibility
- delete sections

Why it matters:

- this enables dynamic public page composition without redeploying
- it creates a natural future opportunity for section-level analytics and AI-assisted layout/content suggestions

## Feature Flags

The admin app exposes runtime feature flags for behavior such as:

- analytics collection
- real-time analytics
- caching
- maintenance mode
- inquiry form behavior
- content visibility toggles

This gives the platform operational flexibility without requiring code changes for every toggle.

## Theme Manager

Current theme controls include:

- mode
- primary and accent colors
- font selection
- border radius
- animation speed
- custom CSS

This directly affects public/admin presentation and is already wired through theme APIs and CSS variables.

## Settings

The settings page currently focuses on admin password changes.

## High-Value Near-Term Additions

The most natural next admin upgrades based on current implementation are:

- AI inquiry triage inside inquiries
- AI content assistance in content managers
- AI analytics summaries in insights/analytics
- global admin search
- section-level analytics

These fit the current architecture cleanly and build on surfaces that already exist.
