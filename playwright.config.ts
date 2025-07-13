import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173
	},

	testDir: 'e2e',
	
	// Fail the build on CI if you accidentally left test.only in the source code
	forbidOnly: !!process.env.CI,
	
	// Retry on CI only
	retries: process.env.CI ? 2 : 0,
	
	// Opt out of parallel tests on CI
	workers: process.env.CI ? 1 : undefined,
	
	// Reporter to use
	reporter: [
		['html', { outputFolder: 'playwright-report' }],
		['list']
	],
	
	use: {
		// Base URL to use in actions like `await page.goto('/')`
		baseURL: 'http://localhost:4173',
		
		// Collect trace when retrying the failed test
		trace: 'on-first-retry',
		
		// Record video on failure
		video: 'retain-on-failure',
		
		// Take screenshot on failure
		screenshot: 'only-on-failure',
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
});
