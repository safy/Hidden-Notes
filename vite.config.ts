import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './public/manifest.json';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1', // Принудительно используем IPv4
    port: 5174,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        sidepanel: 'src/sidepanel/index.html',
        test: 'src/test-page/index.html',
      },
    },
  },
});














