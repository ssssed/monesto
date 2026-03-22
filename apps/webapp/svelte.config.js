import path from 'node:path';
import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Исходники ui-kit: компоненты импортируют `$lib/*`, иначе SvelteKit резолвит в `src/lib` webapp. */
const uiKitLib = path.resolve(__dirname, '../../packages/ui-kit/src/lib');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter(),
		files: {
			routes: 'src/app/routes',
			appTemplate: 'src/app/app.html',
			/** Иначе `$lib` в компонентах ui-kit резолвится в `src/lib` webapp. */
			lib: uiKitLib
		}
	},
};

export default config;
