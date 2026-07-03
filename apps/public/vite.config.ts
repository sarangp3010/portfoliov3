import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  // In local dev the public app is mounted at the root of public.localhost.
  // Production static hosting still emits assets under /public/.
  base: command === 'serve' ? '/' : '/public/',
  plugins: [react()],
  server: {
    port: 3000,
    // Bind to all interfaces so the app can be opened via this machine's IP.
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      '/api':     { target: 'http://127.0.0.1:5001', changeOrigin: true },
      '/uploads': { target: 'http://127.0.0.1:5001', changeOrigin: true },
    },
  },
  build: {
    // Production: outputs to /dist/public at the repo root
    outDir: '../../dist/public',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
}));
