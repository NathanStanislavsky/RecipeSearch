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

	async clickViewRecipeDetails(recipeName: string) {
		const recipeCard = this.page.locator(`[aria-label="Recipe card for ${recipeName}"]`);
		await recipeCard.locator('button:has-text("View Recipe Details")').click();

		// Wait for modal to be visible
		await expect(this.page.locator('[role="document"]')).toBeVisible();
	}

	async verifyRecipeDetails(recipeName: string, calories: number) {
		// Target the modal overlay, not the recipe card
		const modal = this.page.locator('[role="document"]');
		await expect(modal).toBeVisible();

		// Verify modal title
		await expect(modal.locator(`h2:has-text("${recipeName}")`)).toBeVisible();

		// Verify nutrition section and calories
		await expect(modal.locator('h3:has-text("Nutrition")')).toBeVisible();
		await expect(modal.locator('text=Calories:')).toBeVisible();
		await expect(modal.locator(`text=${calories}`)).toBeVisible();
		await expect(modal.locator('h3:has-text("Ingredients")')).toBeVisible();
		await expect(modal.locator('h3:has-text("Instructions")')).toBeVisible();
	}

	async closeRecipeDetails() {
		await this.page.keyboard.press('Escape');
	}

	async verifyNoResults() {
		const noResultsMessage = this.page.locator('text=No results');
		await expect(noResultsMessage).toBeVisible();
	}
}
