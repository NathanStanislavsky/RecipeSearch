import { type Page, expect } from '@playwright/test';
import type { RecipeResponse } from '../../types/recipe.ts';
export class SearchHelper {
	private page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async search(searchTerm: string) {
		await this.fillSearchInput(searchTerm);
		await this.clickSearchButton();
	}

	async fillSearchInput(value: string) {
		const searchInput = this.page.locator(
			'input[placeholder="Enter ingredients separated by commas (e.g., tomato, basil, garlic)"]'
		);
		await searchInput.fill(value);
		await expect(searchInput).toHaveValue(value);
	}

	async clickSearchButton() {
		const searchButton = this.page.locator('button:has-text("Search")');
		await searchButton.click();
	}

	async simulateApiResponse(responseBody: RecipeResponse | RecipeResponse[], delayMs: number = 0) {
		await this.page.route('**/search*', async (route) => {
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

	async verifyLoadingState() {
		// Verify loading state appears
		const loadingMessage = this.page.locator('text=Loading...');
		await expect(loadingMessage).toBeVisible();

		// Verify results appear and loading disappears
		const resultsContainer = this.page.locator('div.w-full.max-w-4xl.px-4');
		await expect(resultsContainer).toBeVisible();
		await expect(loadingMessage).not.toBeVisible();

		return resultsContainer;
	}

	async verifyRecipeLink(expectedUrl: string) {
		const resultsContainer = this.page.locator('div.w-full.max-w-4xl.px-4');
		const firstResultLink = resultsContainer.locator('a').first();
		await expect(firstResultLink).toBeVisible();
		const href = await firstResultLink.getAttribute('href');
		expect(href).toBeTruthy();
		expect(href).toContain(expectedUrl);
	}
}
