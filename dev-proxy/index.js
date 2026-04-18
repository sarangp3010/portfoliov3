/**
 * dev-proxy/index.js
 *
 * Single-port development reverse proxy.
 * Listens on :5173 and routes by subdomain:
 *
 *   public.localhost:5173   →  Vite (public)    :3000
 *   admin.localhost:5173    →  Vite (admin)      :3001
 *   customer.localhost:5173 →  Vite (customer)   :3002
 *   api.localhost:5173      →  Express API       :5000
 *   localhost:5173          →  Vite (public)     :3000  (default)
 *
 * All *.localhost subdomains resolve to 127.0.0.1 natively in modern
 * browsers and OS resolvers — no /etc/hosts edits needed.
 */

import http from 'http';
import httpProxy from 'http-proxy';

const PROXY_PORT = 5173;

// Subdomain → internal target mapping
const ROUTES = {
  public:   'http://127.0.0.1:3000',
  admin:    'http://127.0.0.1:3001',
  customer: 'http://127.0.0.1:3002',
  api:      'http://127.0.0.1:5000',
};
const DEFAULT_TARGET = ROUTES.public;

const COLORS = {
  reset:    '\x1b[0m',
  cyan:     '\x1b[36m',
  green:    '\x1b[32m',
  yellow:   '\x1b[33m',
  red:      '\x1b[31m',
  dim:      '\x1b[2m',
  bold:     '\x1b[1m',
};
const c = (color, text) => `${COLORS[color]}${text}${COLORS.reset}`;

function getSubdomain(host) {
  if (!host) return null;
  // Strip port
  const hostname = host.split(':')[0];
  // e.g. "public.localhost" → "public"
  const parts = hostname.split('.');
  if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
    const sub = parts[0];
    if (sub === 'localhost') return null; // bare localhost
    return sub;
  }
  return null;
}

function resolveTarget(host) {
  const sub = getSubdomain(host);
  if (!sub) return DEFAULT_TARGET;
  return ROUTES[sub] || DEFAULT_TARGET;
}

// Create proxy instance with WebSocket support (Vite HMR uses WS)
const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  ws: true,
});

proxy.on('error', (err, req, res) => {
  const host = req.headers?.host || '?';
  const sub  = getSubdomain(host) || 'public';
  const target = resolveTarget(host);

  console.error(c('red', `[proxy] Error routing ${host} → ${target}: ${err.message}`));

  if (res && !res.headersSent && res.writeHead) {
    res.writeHead(502, { 'Content-Type': 'text/html' });
    res.end(`
      <html><body style="font-family:monospace;padding:2rem;background:#0f1117;color:#ef4444">
        <h2>502 — Dev server not ready</h2>
        <p>Could not reach <code>${target}</code> for <strong>${sub}</strong>.</p>
        <p style="color:#94a3b8">Make sure all apps are running. Check the terminal for errors.</p>
        <pre style="color:#64748b;font-size:0.8em">npm run dev  (from project root)</pre>
      </body></html>
    `);
  }
});

// HTTP server
const server = http.createServer((req, res) => {
  const host   = req.headers.host || '';
  const target = resolveTarget(host);
  proxy.web(req, res, { target });
});

// WebSocket upgrade (Vite HMR)
server.on('upgrade', (req, socket, head) => {
  const host   = req.headers.host || '';
  const target = resolveTarget(host);
  proxy.ws(req, socket, head, { target });
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log('');
  console.log(c('bold', c('cyan', '  ┌─────────────────────────────────────────────────────┐')));
  console.log(c('bold', c('cyan', '  │          Dev Proxy — Single Port :5173              │')));
  console.log(c('bold', c('cyan', '  └─────────────────────────────────────────────────────┘')));
  console.log('');
  console.log(`  ${c('green', '▶')} ${c('bold', 'http://public.localhost:5173')}   ${c('dim', '→ Vite :3000')}`);
  console.log(`  ${c('green', '▶')} ${c('bold', 'http://admin.localhost:5173')}    ${c('dim', '→ Vite :3001')}`);
  console.log(`  ${c('green', '▶')} ${c('bold', 'http://customer.localhost:5173')} ${c('dim', '→ Vite :3002')}`);
  console.log(`  ${c('yellow', '▶')} ${c('bold', 'http://api.localhost:5173')}     ${c('dim', '→ Express :5000')}`);
  console.log('');
  console.log(`  ${c('dim', 'Proxy listening on port')} ${c('cyan', String(PROXY_PORT))}`);
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => server.close());
process.on('SIGINT',  () => server.close());
