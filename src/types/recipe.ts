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
	_id: string;
	name: string;
	id: number;
	minutes: number;
	contributor_id: number;
	submitted: string;
	tags: string;
	nutrition: string;
	n_steps: number;
	steps: string;
	description: string;
	ingredients: string;
	n_ingredients: number;
	score: number;
}

export interface TransformedRecipe {
	id: number;
	name: string;
	minutes: number;
	nutrition: string;
	steps: string;
	description: string;
	ingredients: string;
	score: number;
}
