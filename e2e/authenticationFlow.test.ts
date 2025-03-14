import { test, expect, Page } from '@playwright/test';
import { pool } from '$lib/server/db/index.ts';
import { registerUser, loginUser } from "../test-utils/authenticatione2e"

test.describe('authentication flow', () => {
	// Declare the uniqueEmail variable outside the test so it can be used in cleanup
	let uniqueEmail: string;

	test('should register a user and then log in successfully', async ({ page }) => {
		// Generate a unique email for each test run
		uniqueEmail = `test-${Date.now()}@example.com`;
		const password = 'password123';
		const name = 'testUser';

		await registerUser(page, name, uniqueEmail, password);
		await loginUser(page, uniqueEmail, password);

		// Assert that user is on the main page
		expect(page.url()).toContain('/search');
		// Verify that the header is present
		await expect(page.locator('h1')).toHaveText('What is in your fridge?');
	});

	// Clean up the test data by deleting the user created during the test.
	test.afterEach(async () => {
		if (uniqueEmail) {
			await pool.query('DELETE FROM users WHERE email = $1', [uniqueEmail]);
		}
	});
});
