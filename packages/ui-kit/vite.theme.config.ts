import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'vite';

/** Сборка theme.css: переменные темы + утилиты Tailwind по компонентам lib/ */
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/theme-entry.js'),
      formats: ['es'],
      fileName: () => 'theme-placeholder',
    },
    rollupOptions: {
      output: {
        assetFileNames: () => 'theme.css',
      },
    },
    cssCodeSplit: false,
  },
});
