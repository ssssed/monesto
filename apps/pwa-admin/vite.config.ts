import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@monesto/rune': path.resolve(__dirname, '../../packages/rune/src'),
    },
  },
  server: {
    port: 8194,
    host: true,
  },
  preview: {
    port: 8194,
  },
});
