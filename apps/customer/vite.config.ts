import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  // In local dev the customer app is mounted at the root of customer.localhost.
  // Production static hosting still emits assets under /customer/.
  base: command === 'serve' ? '/' : '/customer/',
  plugins: [react()],
  server: {
    port: 3002,
    // Bind to all interfaces so the app can be opened via this machine's IP.
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      '/api':     { target: 'http://127.0.0.1:5001', changeOrigin: true },
      '/uploads': { target: 'http://127.0.0.1:5001', changeOrigin: true },
    },
  },
  build: {
    // Production: outputs to /dist/customer at the repo root
    outDir: '../../dist/customer',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
}));
