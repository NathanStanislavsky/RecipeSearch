// Main recipe interface (from MongoDB)
export interface TransformedRecipe {
	id: number;
	name: string;
	minutes: number;
	nutrition: string;
	steps: string;
	description: string;
	ingredients: string;
	userRating?: number;
}

// Recipe search options
export interface RecipeSearchOptions {
	limit?: number;
	skip?: number;
	sortBy?: 'score' | 'name' | 'minutes';
	sortOrder?: 'asc' | 'desc';
}

// Recipe from PostgreSQL (favorites table)
export interface SavedRecipe {
	id: number;
	image: string;
	title: string;
	readyInMinutes: number;
	servings: number;
	sourceUrl: string;
}

// Recipe recommendation result
export interface RecipeRecommendation {
	recipeId: number;
	score: number;
	reason?: string;
}

// Recipe rating
export interface RecipeRating {
	id?: number;
	userId: string;
	recipeId: string;
	rating: number;
	createdAt?: Date;
	updatedAt?: Date;
}

// Search result metadata
export interface RecipeSearchResult {
	recipes: TransformedRecipe[];
	total: number;
	query: string;
	hasMore: boolean;
} 