import { test, expect, Page } from '@playwright/test';
import { pool } from '../src/lib/server/db/index.js';
import { registerUser, loginUser } from '../src/utils/test/authenticationUtils.js';
import { SearchHelper } from '../src/utils/test/searchHelper.js';
import type { TransformedRecipe } from '../src/types/recipe.js';

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

		const mockRecipe: TransformedRecipe = {
			id: 536256,
			name: 'carrot beet juice',
			minutes: 13,
			nutrition: '[81, 0, 38.0, 12.0, 3, 0, 5]',
			steps:
				'["Juice Half The Carrots", "Juice the beet", "Juice The Remaining Carrots", "Serve and Enjoy"]',
			description:
				"one of my favorites. i love it when it's served right away over ice. just make sure nto to over power the carrot juice with the beet. try to use cold veggies it is a big difference in taste if you juice room temp veggies.",
			ingredients: '["carrots", "beet"]',
			score: 0.95,
			userRating: 4
		};

		// Parse the JSON strings to get the actual data
		const parsedNutrition = JSON.parse(mockRecipe.nutrition);
		const calories = Math.round(parsedNutrition[0]);

		const searchTerm = 'Carrots';
		await searchHelper.search(searchTerm);

		await searchHelper.verifyRecipeCard(mockRecipe.name, mockRecipe.minutes, mockRecipe.description);

		// Click to open the recipe details modal
		await searchHelper.clickViewRecipeDetails(mockRecipe.name);

		// Verify recipe details in the modal
		await searchHelper.verifyRecipeDetails(mockRecipe.name, calories);

		// Close the recipe details modal
		await searchHelper.closeRecipeDetails();

		// Verify the recipe card is still visible
		await searchHelper.verifyRecipeCard(mockRecipe.name, mockRecipe.minutes, mockRecipe.description);
	});

	test('complete journey with no search results', async ({ page }) => {
		await completeRegistrationAndLogin(page);

		// Perform search
		const searchTerm = 'NonExistentIngredient';
		await searchHelper.search(searchTerm);

		// Verify "No results" message appears
		await searchHelper.verifyNoResults();
	});
});
