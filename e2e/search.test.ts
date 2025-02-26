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

test('Search functionality: verify results and recipe link navigation', async ({ page }) => {
	await page.goto('/');
	const searchTerm = 'Carrots';

	await fillSearchInput(page, searchTerm);
	await clickSearchButton(page);

	const resultsContainer = page.locator('div.w-full.max-w-4xl.px-4');
	await expect(resultsContainer).toBeVisible();

	const firstResultLink = resultsContainer.locator('a').first();
	await expect(firstResultLink).toBeVisible();

	const href = await firstResultLink.getAttribute('href');
	expect(href).toBeTruthy();

	await expect(href).toContain("https://www.acedarspoon.com/4-ingredient-carrot-raisin-salad/");
});
