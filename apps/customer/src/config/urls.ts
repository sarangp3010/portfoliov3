/**
 * Cross-app subdomain URLs for the customer app.
 */

const DEV_PROXY_PORT = '5173';
const DIRECT_PORTS = {
  public: '3000',
  admin: '3001',
  customer: '3002',
} as const;

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.endsWith('.localhost');
}

function appUrl(app: keyof typeof DIRECT_PORTS, envVar: string | undefined): string {
  if (envVar) return envVar.replace(/\/$/, '');

  const { protocol, hostname, port } = window.location;
  if (port === DEV_PROXY_PORT && isLoopbackHost(hostname)) {
    return `${protocol}//${app}.localhost:${DEV_PROXY_PORT}`;
  }

  return `${protocol}//${hostname}:${DIRECT_PORTS[app]}`;
}

export const PUBLIC_URL = appUrl('public', import.meta.env.VITE_PUBLIC_URL);
export const ADMIN_URL  = appUrl('admin', import.meta.env.VITE_ADMIN_URL);
