import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export const config = ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowObjectTypes: 'always' }
      ]
    }
  },
  {
    files: ['**/*.svelte'],
    ignores: ['.svelte-kit/*'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser
      }
    },
    rules: {
      'prefer-const': 'off',
      'svelte/valid-compile': ['error', { ignoreWarnings: true }]
    }
  },
  {
    files: ['**/*.svelte.ts'],
    rules: {
      'prefer-const': 'off'
    }
  }
);
