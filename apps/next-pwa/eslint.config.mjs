import antfu from '@antfu/eslint-config';
import nextPlugin from '@next/eslint-plugin-next';
import eslintConfigPrettier from 'eslint-config-prettier';
import boundaries from 'eslint-plugin-boundaries';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default antfu(
	{
		// Formatting is owned by Prettier (see .prettierrc.json), not ESLint.
		stylistic: false,
		react: true,
		typescript: true,
		ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts']
	},
	{
		// eslint-config-next's presets re-register the import/react/jsx-a11y plugins that
		// antfu already provides, which ESLint's flat config rejects ("Cannot redefine
		// plugin"). Register only the Next-specific plugin instead.
		plugins: {
			'@next/next': nextPlugin
		},
		rules: {
			...nextPlugin.configs.recommended.rules,
			...nextPlugin.configs['core-web-vitals'].rules
		}
	},
	{
		plugins: {
			'simple-import-sort': simpleImportSort
		},
		rules: {
			'react/no-context-provider': 'off',
			'ts/consistent-type-definitions': ['error', 'type'],
			'perfectionist/sort-imports': 'off',
			'perfectionist/sort-named-imports': ['off'],
			'simple-import-sort/exports': 'error',
			'simple-import-sort/imports': [
				'error',
				{
					groups: [
						['^react', '^next', '^@?\\w'],
						['^(test|tests)(/.*|$)'],
						['^@/app(/.*|$)'],
						['^@/screens(/.*|$)'],
						['^@/widgets(/.*|$)'],
						['^@/features(/.*|$)'],
						['^@/entities(/.*|$)'],
						['^@/kernel(/.*|$)'],
						['^@/shared(/.*|$)'],
						['^\\.\\./'],
						['^\\./'],
						['^.+\\.(css|less|scss)$']
					]
				}
			]
		}
	},
	{
		plugins: {
			boundaries
		},
		settings: {
			'import/resolver': {
				typescript: {
					alwaysTryTypes: true,
					project: './tsconfig.json'
				}
			},
			'boundaries/elements': [
				{ type: 'app', pattern: 'src/app/**/*' },
				{ type: 'screens', pattern: 'src/screens/**/*' },
				{ type: 'widgets', pattern: 'src/widgets/**/*' },
				{ type: 'features', pattern: 'src/features/**/*' },
				{ type: 'entities', pattern: 'src/entities/**/*' },
				{ type: 'kernel', pattern: 'src/kernel/**/*' },
				{ type: 'shared', pattern: 'src/shared/**/*' }
			]
		},
		rules: {
			// element-types: слой не может импортировать слои выше себя (см. таблицу в codestyle-doc).
			'boundaries/dependencies': [
				'error',
				{
					default: 'disallow',
					policies: [
						{
							from: [{ element: { type: 'app' } }],
							allow: [
								{ to: { element: { type: 'screens' } } },
								{ to: { element: { type: 'widgets' } } },
								{ to: { element: { type: 'features' } } },
								{ to: { element: { type: 'entities' } } },
								{ to: { element: { type: 'kernel' } } },
								{ to: { element: { type: 'shared' } } }
							]
						},
						{
							from: [{ element: { type: 'screens' } }],
							allow: [
								{ to: { element: { type: 'widgets' } } },
								{ to: { element: { type: 'features' } } },
								{ to: { element: { type: 'entities' } } },
								{ to: { element: { type: 'kernel' } } },
								{ to: { element: { type: 'shared' } } }
							]
						},
						{
							from: [{ element: { type: 'widgets' } }],
							allow: [
								{ to: { element: { type: 'features' } } },
								{ to: { element: { type: 'entities' } } },
								{ to: { element: { type: 'kernel' } } },
								{ to: { element: { type: 'shared' } } }
							]
						},
						{
							from: [{ element: { type: 'features' } }],
							allow: [
								{ to: { element: { type: 'entities' } } },
								{ to: { element: { type: 'kernel' } } },
								{ to: { element: { type: 'shared' } } }
							]
						},
						{
							from: [{ element: { type: 'entities' } }],
							allow: [
								{ to: { element: { type: 'entities' } } },
								{ to: { element: { type: 'kernel' } } },
								{ to: { element: { type: 'shared' } } }
							]
						},
						{
							from: [{ element: { type: 'kernel' } }],
							allow: [{ to: { element: { type: 'kernel' } } }, { to: { element: { type: 'shared' } } }]
						},
						{
							from: [{ element: { type: 'shared' } }],
							allow: [{ to: { element: { type: 'shared' } } }]
						}
					]
				}
			],
			// entry-point: screens/widgets/features/entities импортируются только через index.ts
			// (публичный экспорт слайса). app/kernel/shared — инфраструктура, открыты полностью.
			// Исключение: entities/*/@x/* — публичный API для кросс-импорта между сущностями.
			'boundaries/entry-point': [
				'error',
				{
					default: 'disallow',
					policies: [
						{
							target: [{ element: { type: 'screens' } }],
							allow: ['index.ts', 'index.tsx']
						},
						{
							target: [{ element: { type: 'widgets' } }],
							allow: ['index.ts', 'index.tsx']
						},
						{
							target: [{ element: { type: 'features' } }],
							allow: ['index.ts', 'index.tsx']
						},
						{
							target: [{ element: { type: 'entities' } }],
							allow: ['index.ts', 'index.tsx', '*/@x/**/*']
						}
					]
				}
			]
		}
	},
	eslintConfigPrettier
);
