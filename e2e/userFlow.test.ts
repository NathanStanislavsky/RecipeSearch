import { test, expect, Page } from '@playwright/test';
import { pool } from '$lib/server/db/index.ts';
import { registerUser, loginUser } from '../test-utils/authenticationUtils';
import { SearchHelper } from '../test-utils/searchHelper';

test.describe('Complete user journey', () => {
	let uniqueEmail: string;
	let searchHelper: SearchHelper;

	test.beforeEach(async ({ page }) => {
		// Generate unique email for each test run
		uniqueEmail = `test-${Date.now()}@example.com`;
		searchHelper = new SearchHelper(page);
	});

	test.afterEach(async () => {
		if (uniqueEmail) {
			await pool.query('DELETE FROM users WHERE email = $1', [uniqueEmail]);
		}
	});

	async function completeRegistrationAndLogin(page: Page) {
		const password = 'password123';
		const name = 'testUser';

		// Start at landing page
		await page.goto('/');

		// Click on register button and wait for navigation
		const registerButton = page.locator('a:has-text("Register")');
		await registerButton.click();
		await page.waitForURL('**/register');

		// Verify we're on the register page
		expect(page.url()).toContain('/register');

		// Register user
		await registerUser(page, name, uniqueEmail, password);

		// Verify we're redirected to login page after registration
		expect(page.url()).toContain('/login');

		// Login with registered credentials
		await loginUser(page, uniqueEmail, password);

		// Verify we're on the search page after login
		expect(page.url()).toContain('/search');
		await expect(page.locator('h1')).toHaveText('What is in your fridge?');
	}

	test('landing page to register to login to search with successful results', async ({ page }) => {
		await completeRegistrationAndLogin(page);

		// 5. Set up mock API response for search
		await searchHelper.simulateApiResponse(
			[
				{
					image: 'https://img.spoonacular.com/recipes/536256-556x370.jpg',
					title: '4-Ingredient Carrot Raisin Salad',
					readyInMinutes: 15,
					servings: 2,
					sourceUrl: 'https://www.acedarspoon.com/4-ingredient-carrot-raisin-salad/'
				}
			],
			1000
		);

		// Perform search
		const searchTerm = 'Carrots';
		await searchHelper.search(searchTerm);

		// Verify loading state appears and then disappears
		await searchHelper.verifyLoadingState();

		// Verify recipe link is correct
		await searchHelper.verifyRecipeLink(
			'https://www.acedarspoon.com/4-ingredient-carrot-raisin-salad/'
		);
	});

	test('complete journey with no search results', async ({ page }) => {
		await completeRegistrationAndLogin(page);

		// Set up empty API response
		await searchHelper.simulateApiResponse([]);

		// Perform search
		const searchTerm = 'NonExistentIngredient';
		await searchHelper.search(searchTerm);

		// Verify "No results" message appears
		const noResultsMessage = page.locator('text=No results');
		await expect(noResultsMessage).toBeVisible();
	});
});
