import { config } from '@monesto/eslint-config/index.js';

export default [
	...config,
	{
		ignores: ['.svelte-kit/*']
	}
];
