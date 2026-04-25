import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type PluginOption } from 'vite';
import pkg from './package.json';

export default defineConfig({
	plugins: [tailwindcss() as PluginOption, sveltekit() as PluginOption],
	ssr: {
		noExternal: ['@monesto/ui-kit']
	},
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version)
	}
});
