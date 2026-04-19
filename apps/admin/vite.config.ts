import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  // In local dev the app is mounted at the root of admin.localhost.
  // Production static hosting still emits assets under /admin/.
  base: command === 'serve' ? '/' : '/admin/',
  plugins: [react()],
  server: {
    port: 3001,
    host: '127.0.0.1',
    strictPort: true,
    proxy: {
      '/api':     { target: 'http://127.0.0.1:5000', changeOrigin: true },
      '/uploads': { target: 'http://127.0.0.1:5000', changeOrigin: true },
    },
  },
  build: {
    // Production: outputs to /dist/admin at the repo root
    outDir: '../../dist/admin',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
}));
