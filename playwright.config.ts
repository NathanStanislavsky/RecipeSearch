import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173
	},

	testDir: 'e2e',

	forbidOnly: !!process.env.CI,

	retries: process.env.CI ? 2 : 0,

	workers: process.env.CI ? 1 : undefined,

	reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

	use: {
		baseURL: 'http://localhost:4173',

		trace: 'on-first-retry',

		video: 'retain-on-failure',

		screenshot: 'only-on-failure'
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	]
});
