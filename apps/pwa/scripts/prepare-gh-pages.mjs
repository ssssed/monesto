#!/usr/bin/env node
/**
 * GitHub Pages serves unknown paths as 404.html.
 * Copying index.html → 404.html keeps SPA deep links working.
 */
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const indexHtml = join(dist, 'index.html');
const notFoundHtml = join(dist, '404.html');

if (!existsSync(indexHtml)) {
  console.error('[prepare-gh-pages] dist/index.html not found. Run build first.');
  process.exit(1);
}

copyFileSync(indexHtml, notFoundHtml);
writeFileSync(join(dist, '.nojekyll'), '');
console.log('[prepare-gh-pages] wrote 404.html and .nojekyll');
