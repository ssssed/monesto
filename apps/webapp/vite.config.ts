import path from 'path';
import { fileURLToPath } from 'url';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Корень `packages/ui-kit` — алиасы нужны, пока нет `dist/` (сборка библиотеки не обязательна для dev). */
const uiKitRoot = path.resolve(__dirname, '../../packages/ui-kit');
const uiKitLib = path.resolve(uiKitRoot, 'src/lib');

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	resolve: {
		alias: {
			$shared: path.resolve(__dirname, 'src/shared'),
			$modules: path.resolve(__dirname, 'src/modules'),
			$infrastructures: path.resolve(__dirname, 'src/infrastructures'),
			'@monesto/ui-kit': uiKitLib,
			'@monesto/ui-kit/theme.css': path.resolve(uiKitRoot, 'src/theme.css')
		}
	},
	ssr: {
		noExternal: ['@monesto/ui-kit']
	}
});
