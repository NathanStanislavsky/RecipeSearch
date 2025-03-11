import { test, expect } from '@playwright/test';

test.describe('authentication flow', () => {
	test('should register a user and then log in successfully', async ({ page }) => {
		// Generate a unique email for each test run
		const uniqueEmail = `test-${Date.now()}@example.com`;
		const password = 'password123';
		const name = 'testUser';

		// --- Registration Flow ---
		// Navigate to the registration page
		await page.goto('/register');

		// Fill out the registration form
		await page.fill('input[name="name"]', name);
		await page.fill('input[name="email"]', uniqueEmail);
		await page.fill('input[name="password"]', password);

		// Submit the registration form
		await page.click('button[type="submit"]');

		// Wait for a successful registration indicator (this might be a navigation or a success message)
		await page.waitForNavigation();

		// --- Login Flow ---
		// Navigate to the login page
		await page.goto('/login');

		// Fill out the login form with the registered credentials
		await page.fill('input[name="email"]', uniqueEmail);
		await page.fill('input[name="password"]', password);

		// Submit the login form
		await page.click('button[type="submit"]');

		// Wait for navigation after login
		await page.waitForNavigation();

		// Assert that the URL indicates the user is on main page
		expect(page.url()).toContain('/');

		// Verify that a header is present
		await expect(page.locator('h1')).toHaveText('What is in your fridge?');
	});
});
