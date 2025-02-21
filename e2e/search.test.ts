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

const searchTest = async (page, searchTerm) => {
	await page.goto('http://localhost:5173/');
	await fillSearchInput(page, searchTerm);
	await clickSearchButton(page);
	await expect(page.locator('input[placeholder="Potatoes, carrots, beef..."]')).toHaveValue(
		searchTerm
	);
};

test('Search functionality on the page with Carrots', async ({ page }) => {
	await searchTest(page, 'Carrots');
});
