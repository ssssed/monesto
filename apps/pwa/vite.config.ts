import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(path.join(__dirname, 'package.json'), 'utf8'),
) as { version: string };

/**
 * GitHub Pages project site: https://<user>.github.io/monesto/
 * Override with BASE_PATH=/ for custom domain or local absolute root.
 */
function resolveBase(mode: string) {
  if (process.env.BASE_PATH !== undefined) {
    const value = process.env.BASE_PATH.trim() || '/';
    return value.endsWith('/') ? value : `${value}/`;
  }
  return mode === 'production' ? '/monesto/' : '/';
}

export default defineConfig(({ mode }) => {
  const base = resolveBase(mode);

  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [
      TanStackRouterVite({
        target: 'react',
        autoCodeSplitting: true,
        routesDirectory: './src/routes',
        generatedRouteTree: './src/routeTree.gen.ts',
      }),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.svg',
          'apple-touch-icon.png',
          '.nojekyll',
        ],
        manifest: {
          name: 'Monesto',
          short_name: 'Monesto',
          description: 'Личные финансы: зарплата → расходы → активы',
          lang: 'ru',
          theme_color: '#2563EB',
          background_color: '#F8FAFC',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: base,
          start_url: base,
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: 'favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          navigateFallback: `${base}index.html`,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webp,webmanifest}'],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@monesto/rune': path.resolve(__dirname, '../../packages/rune/src'),
      },
    },
    server: {
      port: 8193,
      host: true,
    },
    preview: {
      port: 8193,
    },
    build: {
      sourcemap: true,
      target: 'es2022',
    },
  };
});
