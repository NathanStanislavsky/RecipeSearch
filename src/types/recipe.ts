export interface BasicRecipe {
	id: number;
}

export interface DetailedRecipe extends BasicRecipe {
	image: string;
	title: string;
	readyInMinutes: number;
	servings: number;
	sourceUrl: string;
}

export interface RecipeResponse {
	id: number;
	title: string;
	image: string;
	readyInMinutes: number;
	servings: number;
	sourceUrl: string;
}

export interface ExtractRecipeIdsResult {
	recipeIds?: number[];
	errorResponse?: Response;
}

export interface Recipe {
	/** URL to the recipe image */
	image: string;
	/** Recipe title */
	title: string;
	/** Time in minutes to prepare the recipe */
	readyInMinutes: number;
	/** Number of servings the recipe makes */
	servings: number;
	/** URL to the original recipe source */
	sourceUrl: string;
}
