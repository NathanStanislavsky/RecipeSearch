import { type Page, expect } from '@playwright/test';

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

	async verifyRecipeCard(recipeName: string, cookingMinutes: number, description: string) {
		// Verify recipe card is visible
		const recipeCard = this.page.locator(`[aria-label="Recipe card for ${recipeName}"]`);
		await expect(recipeCard).toBeVisible();

		// Verify recipe name within this specific card
		await expect(recipeCard.locator(`h2:has-text("${recipeName}")`)).toBeVisible();

		// Verify cooking time within this specific card
		const timeContainer = recipeCard.locator('.text-blue-100');
		await expect(timeContainer.locator(`text=${cookingMinutes}`)).toBeVisible();
		await expect(timeContainer.locator('text=minutes')).toBeVisible();

		// Verify description section within this card - use more specific selector
		await expect(recipeCard.locator('h3:has-text("Description")')).toBeVisible();
		await expect(recipeCard.locator(`text=${description}`)).toBeVisible();
	}

	async verifyRecipeDetails(recipeName: string, description: string, ingredients: string[]) {
		// Get the specific recipe card first
		const recipeCard = this.page.locator(`[aria-label="Recipe card for ${recipeName}"]`);

		// Verify description section within this card - use more specific selector
		await expect(recipeCard.locator('h3:has-text("Description")')).toBeVisible();
		await expect(recipeCard.locator(`text=${description}`)).toBeVisible();

		// Verify ingredients section within this card - use more specific selector
		await expect(recipeCard.locator('h3:has-text("Ingredients")')).toBeVisible();
		const ingredientsList = recipeCard.locator('ul.text-sm.text-gray-600');

		for (const ingredient of ingredients) {
			// Look for ingredient within the ingredients list only
			await expect(ingredientsList.locator(`text=${ingredient}`)).toBeVisible();
		}
	}

	async verifyNoResults() {
		const noResultsMessage = this.page.locator('text=No results');
		await expect(noResultsMessage).toBeVisible();
	}
}
