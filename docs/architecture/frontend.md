# Frontend Architecture

## Application Shell

The React app boots in `main.tsx`:

```tsx
<BrowserRouter>
  <HelmetProvider>
    <AuthProvider>
      <ThemeProvider>
        <TrackedApp />
      </ThemeProvider>
    </AuthProvider>
  </HelmetProvider>
</BrowserRouter>
```

`TrackedApp` calls `useTracker()` (analytics hook) at the top level, ensuring every route change fires a `PAGE_VIEW` event. All pages are lazy-loaded via `React.lazy()` with a `Suspense` fallback.

---

## Routing

Two separate route trees:

### Public Routes
Wrapped in `PublicLayout` (Navbar + Footer):
- `/` — Home (profile, featured projects)
- `/blog` — Blog listing
- `/blog/:slug` — Blog post
- `/services` — Services + inquiry form
- `/testimonials` — Testimonials
- `/resume` — Resume viewer + PDF export
- `/payment/success` — Payment confirmation
- `/payment/cancel` — Payment cancelled

### Admin Routes
Wrapped in `ProtectedRoute` + `AdminLayout` (sidebar navigation):
- `/admin` — Dashboard
- `/admin/analytics` — Analytics (5 tabs)
- `/admin/analytics/sessions` — Sessions Viewer
- `/admin/insights` — Smart Insights
- `/admin/payments` — Payments Manager
- `/admin/profile` — Profile Editor
- `/admin/blog` — Blog Manager
- `/admin/projects` — Projects Manager
- `/admin/services` — Services Manager
- `/admin/testimonials` — Testimonials Manager
- `/admin/resume` — Resume Manager
- `/admin/inquiries` — Inquiries Manager
- `/admin/flags` — Feature Flags
- `/admin/diagnostics` — Dev Diagnostics
- `/admin/theme` — Theme Manager
- `/admin/settings` — Settings

---

## Context Providers

### `AuthContext`

Manages authentication state:
- Stores `user` object (id, email, name, role) and JWT token in React state
- `login(email, password)` calls `/api/auth/login`, stores result
- `logout()` clears state — token is lost (stateless)
- `ProtectedRoute` uses this context to guard admin routes

No localStorage is used. This is intentional — it avoids XSS vectors. Users re-authenticate on page refresh.

### `ThemeContext`

On mount, fetches `/api/theme` and applies settings to `:root` via CSS custom properties:

```typescript
root.style.setProperty('--accent',      hexToRgb(t.primaryColor));
root.style.setProperty('--accent-hex',  t.primaryColor);
root.style.setProperty('--accent2',     hexToRgb(t.accentColor));
root.style.setProperty('--radius',      radiusMap[t.borderRadius]);
root.style.setProperty('--anim-speed',  speedMap[t.animationSpeed]);
root.classList.toggle('light-mode', t.mode === 'light');
```

Tailwind classes like `bg-accent` consume `--accent` via the custom color config. Light mode is toggled by the `html.light-mode` class.

---

## Analytics Hook (`useTracker`)

`apps/public/src/hooks/useTracker.ts` runs at app level and tracks every route change:

```typescript
useEffect(() => {
  if (pathname.startsWith('/admin')) return;   // skip admin routes
  if (_trackedPaths.has(pathname)) return;     // dedupe StrictMode double-fire
  _trackedPaths.add(pathname);
  // ... track PAGE_VIEW
  return () => { _trackedPaths.delete(pathname); };
}, [pathname]);
```

Module-level Sets deduplicate events that React StrictMode would fire twice in development:
- `_trackedPaths` — prevents double PAGE_VIEW per route
- `_viewedSlugs` — prevents double BLOG_VIEW per post

Named tracker functions are exported for direct use in event handlers:

```typescript
export const trackProjectView = (id, title) => trackEvent('PROJECT_VIEW', ...);
export const trackResumeDownload = (fileName) => trackEvent('RESUME_DOWNLOAD', ...);
```

---

## PDF Generation (`utils/pdf.ts`)

PDF generation uses the browser's native `window.print()` API — no third-party libraries required. The flow:

1. Fetch structured data from the appropriate `/api/pdf/*` endpoint
2. Build an HTML string with inline CSS and data interpolation
3. Open a new browser window with the HTML
4. Call `window.print()` after a 600ms delay (allows the page to render)

The user's browser print dialog opens, and they can save as PDF.

Available exports:
- `downloadResumePDF()` — profile, skills, stats, featured projects
- `downloadPortfolioPDF()` — full portfolio with projects, blog, services tables
- `downloadReceiptPDF(payment)` — itemized payment receipt
- `downloadAnalyticsReportPDF(days)` — visitor metrics and top pages

---

## Design System

Tailwind is configured with a custom design system in `tailwind.config.ts`:

**Colors:**
- `accent` — primary brand color (default: indigo-500, overridable via ThemeContext)
- `surface-900` / `surface-950` — dark card and page backgrounds
- All slate shades for text hierarchy

**Typography:**
- `font-sans` — Plus Jakarta Sans (body text)
- `font-mono` — JetBrains Mono (code, labels)
- `font-display` — Syne (headings)

**Component Classes** (in `index.css`):
- `.card` — base card with surface bg and border
- `.card-hover` — card with accent hover effect
- `.btn`, `.btn-primary`, `.btn-outline`, `.btn-ghost`, `.btn-danger` — button variants
- `.input`, `.label`, `.form-group` — form controls
- `.tag`, `.badge` — inline labels
- `.stat-card` — dashboard stat card
- `.data-table` — admin data tables
- `.gradient-text`, `.gradient-text-accent` — heading gradient effects
- `.section-label` — mono caps section eyebrow
- `.glow-line` — horizontal accent gradient line

---

## Animations

Framer Motion is used throughout:

**Page transitions:** `AnimatePresence` wraps route content with `opacity` fade + `y` slide
**Section reveals:** `whileInView` with `viewport={{ once: true }}` for scroll animations
**Staggered lists:** Custom variants with `delay: i * 0.1` for item lists
**Interactive elements:** `whileHover` scale and lift effects on cards
**Counters:** `motion.div` animate from `0` to target value on mount

Animation speed is controlled globally via the `--anim-speed` CSS variable set by ThemeContext.

---

## State Management

No global state library (Redux, Zustand) is used. State is managed at the component level with `useState` and `useCallback`, with React Context only for truly cross-cutting concerns (auth, theme).

This keeps the codebase simple and ensures each page component owns its data fetching lifecycle.
