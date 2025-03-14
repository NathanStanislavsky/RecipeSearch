import { test, expect, Page } from '@playwright/test';
import { pool } from '$lib/server/db/index.ts';
import { registerUser, loginUser } from '../test-utils/authenticatione2e'

const fillSearchInput = async (page: Page, value: string) => {
	const searchInput = page.locator('input[placeholder="Potatoes, carrots, beef..."]');
	await searchInput.fill(value);
	await expect(searchInput).toHaveValue(value);
};

const clickSearchButton = async (page: Page) => {
	const searchButton = page.locator('button:has-text("Search")');
	await searchButton.click();
};

async function simulateApiResponse(page: Page, responseBody: any, delayMs: number = 0) {
	await page.route('**/searchRecipes*', async (route) => {
		if (delayMs) {
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(responseBody)
		});
	});
}

test.describe('Complete user journey', () => {
	let uniqueEmail: string;

	test.beforeEach(async () => {
		// Generate unique email for each test run
		uniqueEmail = `test-${Date.now()}@example.com`;
	});

	test.afterEach(async () => {
		if (uniqueEmail) {
			await pool.query('DELETE FROM users WHERE email = $1', [uniqueEmail]);
		}
	});

	test('landing page to register to login to search with successful results', async ({ page }) => {
		const password = 'password123';
		const name = 'testUser';

		// 1. Start at landing page
		await page.goto('/');

		// 2. Click on register button
		const registerButton = page.locator('a:has-text("Register")');
		await registerButton.click();

		// Verify we're on the register page
		expect(page.url()).toContain('/register');

		// 3. Register user
		await registerUser(page, name, uniqueEmail, password);

		// Verify we're redirected to login page after registration
		expect(page.url()).toContain('/login');

		// 4. Login with registered credentials
		await loginUser(page, uniqueEmail, password);

		// Verify we're on the search page after login
		expect(page.url()).toContain('/search');
		await expect(page.locator('h1')).toHaveText('What is in your fridge?');

		// 5. Set up mock API response for search
		await simulateApiResponse(
			page,
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

		// 6. Perform search
		const searchTerm = 'Carrots';
		await fillSearchInput(page, searchTerm);
		await clickSearchButton(page);

		// Verify loading state appears
		const loadingMessage = page.locator('text=Loading...');
		await expect(loadingMessage).toBeVisible();

		// Verify results appear and loading disappears
		const resultsContainer = page.locator('div.w-full.max-w-4xl.px-4');
		await expect(resultsContainer).toBeVisible();
		await expect(loadingMessage).not.toBeVisible();

		// Verify recipe link is correct
		const firstResultLink = resultsContainer.locator('a').first();
		await expect(firstResultLink).toBeVisible();
		const href = await firstResultLink.getAttribute('href');
		expect(href).toBeTruthy();
		expect(href).toContain('https://www.acedarspoon.com/4-ingredient-carrot-raisin-salad/');
	});

	test('complete journey with no search results', async ({ page }) => {
		const password = 'password123';
		const name = 'testUser';

		// 1. Start at landing page
		await page.goto('/');

		// 2. Navigate to register page
		const registerButton = page.locator('a:has-text("Register")');
		await registerButton.click();

		// 3. Register user
		await registerUser(page, name, uniqueEmail, password);

		// 4. Login with registered credentials
		await loginUser(page, uniqueEmail, password);

		// 5. Set up empty API response
		await simulateApiResponse(page, []);

		// 6. Perform search
		const searchTerm = 'NonExistentIngredient';
		await fillSearchInput(page, searchTerm);
		await clickSearchButton(page);

		// Verify "No results" message appears
		const noResultsMessage = page.locator('text=No results');
		await expect(noResultsMessage).toBeVisible();
	});
});
