import type { StorybookConfig } from '@storybook/sveltekit';
import { mergeConfig } from 'vite';
import path from 'path';

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|ts|svelte)'],
	addons: [
		'@storybook/addon-svelte-csf',
		'@storybook/addon-essentials',
		'@chromatic-com/storybook',
		'@storybook/addon-interactions'
	],
	framework: {
		name: '@storybook/sveltekit',
		options: {}
	},
	async viteFinal(config) {
		return mergeConfig(config, {
			resolve: {
				alias: {
					'$app/stores': path.resolve('./.storybook/mocks/stores.js'),
					'$app/navigation': path.resolve('./.storybook/mocks/navigation.js'),
					$lib: path.resolve('./src/lib')
				}
			}
		});
	}
};

export default config;
