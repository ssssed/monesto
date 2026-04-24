import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type PluginOption } from 'vite';

export default defineConfig({
	plugins: [tailwindcss() as PluginOption, sveltekit() as PluginOption],
	ssr: {
		noExternal: ['@monesto/ui-kit']
	}
});
