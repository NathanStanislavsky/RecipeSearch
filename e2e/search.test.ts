import { test, expect } from '@playwright/test';

const fillSearchInput = async (page, value) => {
	const searchInput = page.locator('input[placeholder="Potatoes, carrots, beef..."]');
	await searchInput.fill(value);
	await expect(searchInput).toHaveValue(value);
};

const clickSearchButton = async (page) => {
	const searchButton = page.locator('button:has-text("Search")');
	await searchButton.click();
};

test('Search functionality: verify loading and results with recipe link navigation', async ({
	page
}) => {
	// Intercept the search API to simulate a delayed response.
	await page.route('**/searchRecipes*', async (route) => {
		// Introduce an artificial delay to allow the loading state to be visible.
		await new Promise((resolve) => setTimeout(resolve, 2000));
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify([
				{
					image: 'https://img.spoonacular.com/recipes/536256-556x370.jpg',
					title: '4-Ingredient Carrot Raisin Salad',
					readyInMinutes: 15,
					servings: 2,
					sourceUrl: 'https://www.acedarspoon.com/4-ingredient-carrot-raisin-salad/'
				}
			])
		});
	});

	await page.goto('/');
	const searchTerm = 'Carrots';

	await fillSearchInput(page, searchTerm);
	await clickSearchButton(page);

	// Verify that the "Loading..." message is displayed while waiting.
	const loadingMessage = page.locator('text=Loading...');
	await expect(loadingMessage).toBeVisible();

	// Wait for the results container to appear.
	const resultsContainer = page.locator('div.w-full.max-w-4xl.px-4');
	await expect(resultsContainer).toBeVisible();

	// Verify that the loading message disappears once results are rendered.
	await expect(loadingMessage).not.toBeVisible();

	const firstResultLink = resultsContainer.locator('a').first();
	await expect(firstResultLink).toBeVisible();

	const href = await firstResultLink.getAttribute('href');
	expect(href).toBeTruthy();
	await expect(href).toContain('https://www.acedarspoon.com/4-ingredient-carrot-raisin-salad/');
});

test('Search functionality: show "No results" when search returns empty', async ({ page }) => {
	// Intercept the search API to simulate a response with no results.
	await page.route('**/searchRecipes*', (route) => {
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify([])
		});
	});

	await page.goto('/');
	const searchTerm = 'NonExistentIngredient';
	await fillSearchInput(page, searchTerm);
	await clickSearchButton(page);

	// Verify that "No results" is displayed.
	const noResultsMessage = page.locator('text=No results');
	await expect(noResultsMessage).toBeVisible();
});
