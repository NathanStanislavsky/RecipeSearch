import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default [
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	{
		files: ['src/**/*.{js,ts,svelte}'],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['src/**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		}
	},
	{
		ignores: [
			// Build outputs
			'.svelte-kit/**',
			'build/**',
			'dist/**',
			// Vercel
			'.vercel/**',
			// Dependencies
			'node_modules/**',
			// Config files
			'*.config.js',
			'*.config.ts',
			// Environment variables
			'.env',
			'.env.*',
			'!.env.example',
			// Logs
			'*.log',
			// OS files
			'.DS_Store',
			'Thumbs.db',
			// IDE
			'.vscode/**',
			'.idea/**'
		]
	},
	prettier,
	...svelte.configs['flat/prettier']
];
