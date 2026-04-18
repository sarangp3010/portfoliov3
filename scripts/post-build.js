/**
 * scripts/post-build.js
 *
 * Runs after `build:all`. Writes a _redirects file into each app's dist
 * folder so Netlify serves index.html for all client-side routes (React Router).
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const apps = ['public', 'admin', 'customer'];

// Netlify SPA redirect — serve index.html for every path
const redirects = '/*    /index.html   200\n';

for (const app of apps) {
  const dir = join(root, 'dist', app);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, '_redirects'), redirects);
  console.log(`✓ _redirects written → dist/${app}/_redirects`);
}

console.log('\nPost-build complete.');
