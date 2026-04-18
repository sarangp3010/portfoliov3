/**
 * Cross-app subdomain URLs for the admin app.
 */

const DEV_PORT = window.location.port ? `:${window.location.port}` : '';

function subdomainUrl(sub: string, envVar: string | undefined): string {
  if (envVar) return envVar.replace(/\/$/, '');
  return `${window.location.protocol}//${sub}.localhost${DEV_PORT}`;
}

export const PUBLIC_URL   = subdomainUrl('public',   import.meta.env.VITE_PUBLIC_URL);
export const CUSTOMER_URL = subdomainUrl('customer', import.meta.env.VITE_CUSTOMER_URL);
export const ADMIN_URL    = subdomainUrl('admin',    import.meta.env.VITE_ADMIN_URL);
