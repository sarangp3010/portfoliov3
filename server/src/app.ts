import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { createRouter } from './routes/index.js';

const app = express();
const renderPortalFallbackPage = (currentPath: string, redirectUrl: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Portfolio API Gateway</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #020617;
        --panel: rgba(15, 23, 42, 0.84);
        --panel-strong: rgba(15, 23, 42, 0.94);
        --border: rgba(99, 102, 241, 0.22);
        --text: #e2e8f0;
        --muted: #94a3b8;
        --primary: #818cf8;
        --secondary: #67e8f9;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        font-family: Inter, system-ui, sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(99, 102, 241, 0.22), transparent 35%),
          radial-gradient(circle at bottom right, rgba(34, 211, 238, 0.14), transparent 35%),
          var(--bg);
      }
      .shell {
        width: min(920px, 100%);
        border: 1px solid var(--border);
        background: var(--panel);
        backdrop-filter: blur(20px);
        border-radius: 30px;
        overflow: hidden;
        box-shadow: 0 40px 120px rgba(2, 6, 23, 0.7);
      }
      .grid {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
      }
      .hero, .side { padding: 40px; }
      .hero {
        background:
          radial-gradient(circle at top left, rgba(99, 102, 241, 0.18), transparent 42%),
          linear-gradient(180deg, rgba(15, 23, 42, 0.48), rgba(15, 23, 42, 0.12));
      }
      .eyebrow {
        display: inline-flex;
        padding: 8px 12px;
        border-radius: 999px;
        font-size: 11px;
        letter-spacing: 0.26em;
        text-transform: uppercase;
        color: #c4b5fd;
        background: rgba(99, 102, 241, 0.12);
        border: 1px solid rgba(99, 102, 241, 0.2);
      }
      h1 {
        margin: 22px 0 12px;
        font-size: clamp(2.4rem, 7vw, 4.6rem);
        line-height: 0.95;
      }
      p {
        margin: 0;
        color: var(--muted);
        line-height: 1.7;
        font-size: 16px;
      }
      code {
        display: inline-block;
        margin-top: 12px;
        padding: 6px 10px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        color: var(--secondary);
        word-break: break-all;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 28px;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 12px 18px;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 700;
        transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      }
      .btn:hover { transform: translateY(-1px); }
      .btn-primary {
        color: white;
        background: linear-gradient(135deg, #6366f1, #4f46e5);
        box-shadow: 0 16px 36px rgba(99, 102, 241, 0.32);
      }
      .btn-secondary {
        color: var(--text);
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .side {
        border-left: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.02);
      }
      .card {
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: var(--panel-strong);
        border-radius: 22px;
        padding: 20px;
      }
      .label {
        margin-bottom: 12px;
        font-size: 11px;
        letter-spacing: 0.26em;
        text-transform: uppercase;
        color: var(--muted);
      }
      ul {
        list-style: none;
        padding: 0;
        margin: 18px 0 0;
      }
      li + li { margin-top: 12px; }
      li a {
        display: block;
        padding: 14px 16px;
        border-radius: 16px;
        text-decoration: none;
        color: var(--text);
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);
      }
      li a small {
        display: block;
        margin-top: 6px;
        color: var(--muted);
      }
      @media (max-width: 760px) {
        .grid { grid-template-columns: 1fr; }
        .side { border-left: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); }
        .hero, .side { padding: 28px; }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <div class="grid">
        <section class="hero">
          <div class="eyebrow">Portfolio API</div>
          <h1>Wrong door.</h1>
          <p>
            You are on the backend server, which is reserved for API traffic and uploads.
            If you were trying to view the website, use the public portal button below.
          </p>
          <code>${currentPath}</code>
          <div class="actions">
            <a class="btn btn-primary" href="${redirectUrl}">Open Public Portal</a>
            <a class="btn btn-secondary" href="${redirectUrl}/services">View Services</a>
          </div>
        </section>
        <aside class="side">
          <div class="card">
            <div class="label">Useful Destinations</div>
            <ul>
              <li><a href="${redirectUrl}">Homepage<small>Portfolio overview and featured work</small></a></li>
              <li><a href="${redirectUrl}/blog">Blog<small>Articles, notes, and updates</small></a></li>
              <li><a href="${redirectUrl}/services">Services<small>Offerings, pricing, and inquiry flow</small></a></li>
              <li><a href="${redirectUrl}/resume">Resume<small>Experience summary and downloadable resume</small></a></li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  </body>
</html>`;

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
    // No origin = server-to-server or Postman — always allow
    if (!origin) return callback(null, true);

    // Dev: allow any *.localhost origin without restriction
    if (config.nodeEnv !== 'production') {
      if (/\.localhost(:\d+)?$/.test(origin) || origin === 'http://localhost:5173') {
        return callback(null, true);
      }
    }

    // Production (and dev fallback): explicit allowlist only
    const allowed = [
      config.clientUrl,
      config.publicUrl,
      config.adminUrl,
      config.customerUrl,
    ].filter(Boolean);

    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token'],
}));

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.use('/api/inquiries', rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { success: false, error: 'Too many submissions, please try again later' } }));
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));
app.use('/api/customer/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));
app.use('/api/customer/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }));
app.use('/api/chat', rateLimit({ windowMs: 60 * 1000, max: 20, message: { success: false, error: 'Too many messages, slow down' } }));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Request logger (fire-and-forget, never blocks)
import { requestLogger } from './middleware/requestLogger.js';
app.use('/api', requestLogger);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', env: config.nodeEnv }));

// API routes
app.use('/api', createRouter());

app.use((req, res, next) => {
  const isApiRoute = req.path.startsWith('/api');
  const isUploadRoute = req.path.startsWith('/uploads');
  const wantsHtml = req.method === 'GET' && req.accepts('html');

  if (isApiRoute || isUploadRoute || !wantsHtml) {
    next();
    return;
  }

  const redirectUrl = config.publicUrl;
  res
    .status(404)
    .type('html')
    .send(renderPortalFallbackPage(req.originalUrl, redirectUrl));
});

app.use(notFound);
app.use(errorHandler);

export default app;
