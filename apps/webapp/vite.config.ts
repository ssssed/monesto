import path from 'path';
import { fileURLToPath } from 'url';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	resolve: {
		alias: {
			$shared: path.resolve(__dirname, 'src/shared'),
			$modules: path.resolve(__dirname, 'src/modules'),
			$infrastructures: path.resolve(__dirname, 'src/infrastructures')
		}
	}
});
