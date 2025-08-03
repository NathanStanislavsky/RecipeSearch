import { test, expect, Page } from '@playwright/test';
import { registerUser, loginUser } from '../src/utils/test/authenticationUtils.js';
import { SearchHelper } from '../src/utils/test/searchHelper.js';
import type { TransformedRecipe } from '../src/types/recipe.js';

test.describe('Complete user journey', () => {
	let uniqueEmail: string;
	let searchHelper: SearchHelper;

	test.beforeEach(async ({ page }) => {
		uniqueEmail = `test-${Date.now()}@example.com`;
		searchHelper = new SearchHelper(page);
	});

	async function completeRegistrationAndLogin(page: Page) {
		const password = 'password123';
		const name = 'testUser';

		await page.goto('/');

		const registerButton = page.locator('a:has-text("Register")');
		await registerButton.click();
		await page.waitForURL('**/register');

		expect(page.url()).toContain('/register');

		await registerUser(page, name, uniqueEmail, password);

		expect(page.url()).toContain('/login');

		await loginUser(page, uniqueEmail, password);

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
			userRating: 4
		};

		const parsedNutrition = JSON.parse(mockRecipe.nutrition);
		const calories = Math.round(parsedNutrition[0]);

		const searchTerm = 'Carrots';
		await searchHelper.search(searchTerm);

		await searchHelper.verifyRecipeCard(
			mockRecipe.name,
			mockRecipe.minutes,
			mockRecipe.description
		);

		await searchHelper.clickViewRecipeDetails(mockRecipe.name);

		await searchHelper.verifyRecipeDetails(mockRecipe.name, calories);

		await searchHelper.closeRecipeDetails();

		await searchHelper.verifyRecipeCard(
			mockRecipe.name,
			mockRecipe.minutes,
			mockRecipe.description
		);
	});

	test('complete journey with no search results', async ({ page }) => {
		await completeRegistrationAndLogin(page);

		const searchTerm = 'NonExistentIngredient';
		await searchHelper.search(searchTerm);

		await searchHelper.verifyNoResults();
	});
});
