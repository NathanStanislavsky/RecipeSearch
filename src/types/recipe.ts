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
	/** Unique identifier for the recipe */
	id: string;
}

/** Raw recipe data from MongoDB */
export interface MongoRecipe {
	_id: string;
	AggregatedRating?: number;
	Calories?: number;
	CarbohydrateContent?: number;
	CholesterolContent?: number;
	CookTime?: string | number | null; // Format: PT30M or other types
	Description?: string;
	FatContent?: number;
	FiberContent?: number;
	Images?: string | number | null; // Format: c("url1", "url2", ...) or other types
	Name: string;
	PrepTime?: string | number | null; // Format: PT10M or other types
	ProteinContent?: number;
	RecipeCategory?: string;
	RecipeId?: number;
	RecipeIngredientParts?: string; // Format: c("ingredient1", "ingredient2", ...)
	RecipeServings?: string | number;
	RecipeYield?: string | number;
	ReviewCount?: number;
	SaturatedFatContent?: number;
	SodiumContent?: number;
	SugarContent?: number;
	score?: number; // Added by MongoDB Atlas Search
}
