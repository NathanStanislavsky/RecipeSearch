import { type Page, expect } from '@playwright/test';
import type { TransformedRecipe } from '../../types/recipe.ts';

export interface SearchApiResponse {
	results: TransformedRecipe[];
	total: number;
	query: string;
}

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

	async simulateApiResponse(recipes: TransformedRecipe[], delayMs: number = 0) {
		const responseBody: SearchApiResponse = {
			results: recipes,
			total: recipes.length,
			query: 'test-query'
		};

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

	async verifyRecipeCard(recipeName: string, cookingMinutes: number) {
		// Verify recipe card is visible
		const recipeCard = this.page.locator(`[aria-label="Recipe card for ${recipeName}"]`);
		await expect(recipeCard).toBeVisible();

		// Verify recipe name within this specific card
		await expect(recipeCard.locator(`h2:has-text("${recipeName}")`)).toBeVisible();

		// Verify cooking time within this specific card
		const timeContainer = recipeCard.locator('.text-blue-100');
		await expect(timeContainer.locator(`text=${cookingMinutes}`)).toBeVisible();
		await expect(timeContainer.locator('text=minutes')).toBeVisible();

		return recipeCard;
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

	async verifyNutritionInfo(recipeName: string, calories: number) {
		// Get the specific recipe card first
		const recipeCard = this.page.locator(`[aria-label="Recipe card for ${recipeName}"]`);
		
		// Verify nutrition section within this card - use more specific selector
		await expect(recipeCard.locator('h3:has-text("Nutrition")')).toBeVisible();
		await expect(recipeCard.locator('text=Calories:')).toBeVisible();
		await expect(recipeCard.locator(`text=${calories}`)).toBeVisible();
	}

	async verifyNoResults() {
		const noResultsMessage = this.page.locator('text=No results');
		await expect(noResultsMessage).toBeVisible();
	}
}
