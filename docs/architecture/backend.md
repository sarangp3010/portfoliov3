# Backend Architecture

## Server Entry Point

`server/src/server.ts` bootstraps the application:

1. Loads environment variables via `dotenv`
2. Creates the Express `app` from `app.ts`
3. Starts listening on `PORT` (default 5000)
4. Logs startup to Winston console transport

`server/src/app.ts` applies middleware in order:

```typescript
app.use(helmet())                  // Security headers
app.use(cors(corsOptions))         // CORS for CLIENT_URL
app.use(express.json())            // JSON body parsing
app.use(requestLogger)             // API log to DB
app.use('/api', createRouter())    // All routes under /api
app.use(errorHandler)              // Global error handler
```

---

## Controllers

Controllers follow a strict pattern: no business logic, no direct Prisma access.

```typescript
export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await profileService.get();           // delegate to service
    res.json({ success: true, data: profile });           // consistent envelope
  } catch (err) { next(err); }                           // always pass errors up
};
```

The `{ success: true, data: ... }` response envelope is used everywhere, making frontend error handling predictable.

---

## Services

### `analytics.service.ts`

The most complex service. Provides:

- `trackEvent(visitorId, data)` — logs all analytics events, manages session lifecycle
- `getSummary(days)` — aggregates visitor counts, page views, event breakdowns
- `getBlogStats(days)` — per-post view counts, average engagement duration
- `getProjectStats(days)` — project views, GitHub click rates, demo click rates
- `getVisitorStats(days)` — session stats, browser/device/OS breakdown

Session management logic:
1. First request from a `sessionId` creates `Visitor` + `VisitorSession` records
2. Subsequent events update `VisitorSession.totalEvents` and `navigationPath`
3. `SESSION_END` events calculate `totalDuration` and set `sessionEnd`
4. Admin-originating events (paths starting with `/admin`) are filtered out

### `payment.service.ts`

- `createCheckoutSession(params)` — creates Stripe session + pending DB record
- `handleWebhook(rawBody, signature)` — verifies Stripe signature, processes events idempotently
- `getSessionStatus(sessionId)` — returns payment status for polling
- `getPaymentAnalytics(days)` — daily revenue, by-type breakdown, recent transactions

The webhook handler uses a `PaymentWebhookEvent` table as an idempotency log. If a Stripe event ID is already marked `processed: true`, the handler returns early without re-processing.

### `theme.service.ts`

- `getTheme()` — fetches `ThemeSetting` with id `'default'`, creates defaults if not exists
- `updateTheme(data)` — upserts the single theme record

The `ThemeSetting` table has a single row with primary key `'default'`. This is an intentional design choice — the application has exactly one active theme.

### `version.service.ts`

Tracks content history for Profile, Projects, Blog Posts, and Services:

- Before every update, a `ContentVersion` snapshot is saved
- Admins can view version history and restore any previous snapshot
- Snapshots are stored as JSON, so any content shape is supported

---

## Middleware

### `auth.ts`

```typescript
export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const payload = jwt.verify(token, config.jwtSecret);
  req.user = payload;
  next();
};
```

`adminOnly` is a second middleware that checks `req.user.role === 'ADMIN'`.

### `requestLogger.ts`

Every request is logged to the `ApiLog` table, including:
- Method, path, status code, duration in ms
- IP address, user agent
- User ID (if authenticated)
- Error message (if 4xx/5xx)

This powers the Dev Diagnostics page in the admin panel.

---

## Database

### Migration Rules

Every migration must be a complete, standalone SQL file:
1. `CREATE TYPE` all enums first
2. `CREATE TABLE` in dependency order (referenced tables before referencing)
3. Add indexes after tables
4. Add foreign keys last

Never modify `0001_init`. Always create a new numbered migration.

### Key Relationships

```
Visitor (1) ──────┬──── (many) PageView
                  ├──── (many) AnalyticsEvent
                  ├──── (many) VisitorSession (1) ──── (many) ContentEvent
                  └──── (many) ContentEvent

Project (1) ──── (many) ProjectClick

Payment — standalone (linked by email/inquiryId in metadata)
```

All visitor-related cascades use `onDelete: Cascade` so deleting a Visitor cleans up all associated events. `ContentEvent.sessionId` uses `onDelete: SetNull` so deleting a session keeps the events with `sessionId = null`.

---

## API Request Logging

Every request is timed using `Date.now()` before and after the response. The `requestLogger` middleware attaches a `res.on('finish')` listener to capture the final status code and duration, then writes an `ApiLog` record asynchronously (without blocking the response).

This provides P95 latency data, error rate tracking, and slow request detection visible in the Dev Diagnostics panel.
