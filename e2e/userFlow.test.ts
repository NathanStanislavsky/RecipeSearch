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

		// Create mock recipe data using the new TransformedRecipe structure
		const mockRecipe: TransformedRecipe = {
			id: 536256,
			name: '4-ingredient carrot raisin salad',
			minutes: 15,
			nutrition: '[180.5, 25.0, 35.0, 12.0, 18.0, 8.0, 22.0]',
			steps: '["wash and peel carrots", "grate carrots into bowl", "add raisins and mix", "dress with mayo and serve"]',
			description: 'A simple and refreshing carrot raisin salad perfect for lunch or as a side dish.',
			ingredients: '["carrots", "raisins", "mayonnaise", "lemon juice"]',
			score: 0.95
		};

		// Set up mock API response for search
		await searchHelper.simulateApiResponse([mockRecipe], 1000);

		// Perform search
		const searchTerm = 'Carrots';
		await searchHelper.search(searchTerm);

		// Verify loading state appears and then disappears
		await searchHelper.verifyLoadingState();

		// Verify recipe card appears with correct information
		await searchHelper.verifyRecipeCard(mockRecipe.name, mockRecipe.minutes);

		// Verify recipe details
		await searchHelper.verifyRecipeDetails(
			mockRecipe.name,
			mockRecipe.description,
			['carrots', 'raisins', 'mayonnaise', 'lemon juice']
		);

		// Verify nutrition information shows
		await searchHelper.verifyNutritionInfo(mockRecipe.name, 181); // Rounded calories
	});

	test('complete journey with no search results', async ({ page }) => {
		await completeRegistrationAndLogin(page);

		// Set up empty API response
		await searchHelper.simulateApiResponse([]);

		// Perform search
		const searchTerm = 'NonExistentIngredient';
		await searchHelper.search(searchTerm);

		// Verify "No results" message appears
		await searchHelper.verifyNoResults();
	});

	test('search with multiple recipe results', async ({ page }) => {
		await completeRegistrationAndLogin(page);

		// Create multiple mock recipes
		const mockRecipes: TransformedRecipe[] = [
			{
				id: 123456,
				name: 'carrot cake',
				minutes: 60,
				nutrition: '[350.2, 45.0, 65.0, 20.0, 25.0, 15.0, 40.0]',
				steps: '["mix dry ingredients", "combine wet ingredients", "bake in oven"]',
				description: 'Delicious homemade carrot cake with cream cheese frosting.',
				ingredients: '["carrots", "flour", "sugar", "eggs", "oil"]',
				score: 0.92
			},
			{
				id: 789012,
				name: 'carrot soup',
				minutes: 30,
				nutrition: '[120.1, 15.0, 8.0, 18.0, 12.0, 5.0, 15.0]',
				steps: '["sauté onions", "add carrots and broth", "simmer and blend"]',
				description: 'Warm and comforting carrot soup perfect for cold days.',
				ingredients: '["carrots", "onions", "vegetable broth", "cream"]',
				score: 0.88
			}
		];

		// Set up mock API response with multiple recipes
		await searchHelper.simulateApiResponse(mockRecipes, 500);

		// Perform search
		const searchTerm = 'carrots';
		await searchHelper.search(searchTerm);

		// Verify loading state
		await searchHelper.verifyLoadingState();

		// Verify both recipe cards appear
		await searchHelper.verifyRecipeCard('carrot cake', 60);
		await searchHelper.verifyRecipeCard('carrot soup', 30);

		// Verify recipe details for each card
		await searchHelper.verifyRecipeDetails(
			'carrot cake',
			'Delicious homemade carrot cake with cream cheese frosting.',
			['carrots', 'flour', 'sugar', 'eggs', 'oil']
		);

		await searchHelper.verifyRecipeDetails(
			'carrot soup',
			'Warm and comforting carrot soup perfect for cold days.',
			['carrots', 'onions', 'vegetable broth', 'cream']
		);
	});
});
