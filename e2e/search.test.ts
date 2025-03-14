import { test, expect, Page } from '@playwright/test';
import { pool } from '$lib/server/db/index.ts';
import { registerUser, loginUser } from "../test-utils/authenticatione2e"

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

test.describe('Search functionality', () => {
	let uniqueEmail: string;

	test.afterEach(async () => {
		if (uniqueEmail) {
			await pool.query('DELETE FROM users WHERE email = $1', [uniqueEmail]);
			uniqueEmail = '';
		}
	});

	test('verify loading and results with recipe link navigation', async ({ page }) => {
		uniqueEmail = `test-2@example.com`;
		const password = 'password123';
		const name = 'testUser';

		await registerUser(page, name, uniqueEmail, password);
		await loginUser(page, uniqueEmail, password);

		// Simulate a delayed API response with one valid recipe.
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
			2000
		);

		await page.goto('/search');
		const searchTerm = 'Carrots';

		await fillSearchInput(page, searchTerm);
		await clickSearchButton(page);

		// Verify that the "Loading..." message is displayed.
		const loadingMessage = page.locator('text=Loading...');
		await expect(loadingMessage).toBeVisible();

		// Wait for the results container to appear.
		const resultsContainer = page.locator('div.w-full.max-w-4xl.px-4');
		await expect(resultsContainer).toBeVisible();

		// Ensure the loading message disappears after results are rendered.
		await expect(loadingMessage).not.toBeVisible();

		const firstResultLink = resultsContainer.locator('a').first();
		await expect(firstResultLink).toBeVisible();

		const href = await firstResultLink.getAttribute('href');
		expect(href).toBeTruthy();
		await expect(href).toContain('https://www.acedarspoon.com/4-ingredient-carrot-raisin-salad/');
	});

	test('show "No results" when search returns empty', async ({ page }) => {
		uniqueEmail = `test-1@example.com`;
		const password = 'password123';
		const name = 'testUser';

		await registerUser(page, name, uniqueEmail, password);
		await loginUser(page, uniqueEmail, password);

		// Simulate an API response with no results.
		await simulateApiResponse(page, []);

		await page.goto('/search');
		const searchTerm = 'NonExistentIngredient';
		await fillSearchInput(page, searchTerm);
		await clickSearchButton(page);

		// Verify that "No results" is displayed.
		const noResultsMessage = page.locator('text=No results');
		await expect(noResultsMessage).toBeVisible();
	});
});