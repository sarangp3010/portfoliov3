/**
 * Cross-app subdomain URLs for the public app.
 *
 * In development these resolve via the dev-proxy on port 5173.
 * In production, set VITE_CUSTOMER_URL / VITE_ADMIN_URL build-time env vars.
 *
 * *.localhost resolves to 127.0.0.1 natively in all modern browsers —
 * no /etc/hosts edits required.
 */

const DEV_PORT = window.location.port ? `:${window.location.port}` : '';

function subdomainUrl(sub: string, envVar: string | undefined): string {
  if (envVar) return envVar.replace(/\/$/, '');
  // In development: swap the current subdomain/host for the target subdomain
  return `${window.location.protocol}//${sub}.localhost${DEV_PORT}`;
}

export const CUSTOMER_URL = subdomainUrl('customer', import.meta.env.VITE_CUSTOMER_URL);
export const ADMIN_URL    = subdomainUrl('admin',    import.meta.env.VITE_ADMIN_URL);
export const PUBLIC_URL   = subdomainUrl('public',   import.meta.env.VITE_PUBLIC_URL);
