import { RecipeRepository } from '../repositories/RecipeRepository.js';
import { RatingRepository } from '../repositories/RatingRepository.js';
import type {
	TransformedRecipe,
	RecipeSearchOptions,
	RecipeSearchResult
} from '../models/Recipe.js';
import { ApiError } from '$utils/errors/AppError.js';

export class RecipeService {
	constructor(
		private recipeRepo = new RecipeRepository(),
		private ratingRepo = new RatingRepository()
	) {}

	/**
	 * Search recipes with user ratings included
	 */
	async searchRecipesWithUserRatings(
		query: string,
		userId?: number,
		options?: RecipeSearchOptions
	): Promise<RecipeSearchResult> {
		if (!query || query.trim().length === 0) {
			throw new ApiError('Search query is required', 400);
		}

		const cleanQuery = query.trim();
		const searchOptions = { limit: 50, skip: 0, ...options };

		// Get recipes
		const recipes = await this.recipeRepo.searchByIngredients(cleanQuery, searchOptions);

		// Get user ratings if user is provided
		let enrichedRecipes = recipes;
		if (userId) {
			const userRatings = await this.ratingRepo.getUserRatings(userId);

			// Merge ratings with recipes
			enrichedRecipes = recipes.map((recipe) => ({
				...recipe,
				userRating: userRatings.get(recipe.id)
			}));
		}

		return {
			recipes: enrichedRecipes,
			total: recipes.length,
			query: cleanQuery,
			hasMore: recipes.length === searchOptions.limit
		};
	}

	/**
	 * Get recipe by ID with user rating
	 */
	async getRecipeWithUserRating(
		recipeId: number,
		userId?: number
	): Promise<TransformedRecipe | null> {
		const recipe = await this.recipeRepo.findById(recipeId);
		if (!recipe) return null;

		// Add user rating if user is provided
		if (userId) {
			const userRating = await this.ratingRepo.getUserRatingForRecipe(userId, recipeId);
			recipe.userRating = userRating || undefined;
		}

		return recipe;
	}

	/**
	 * Get multiple recipes by IDs with user ratings
	 */
	async getRecipesByIdsWithUserRatings(
		recipeIds: number[],
		userId?: number
	): Promise<TransformedRecipe[]> {
		if (recipeIds.length === 0) return [];

		// Get recipes
		const recipes = await this.recipeRepo.findByIds(recipeIds);

		// Get user ratings if user is provided
		if (userId) {
			const userRatings = await this.ratingRepo.getUserRatings(userId);

			// Merge ratings with recipes
			return recipes.map((recipe) => ({
				...recipe,
				userRating: userRatings.get(recipe.id)
			}));
		}

		return recipes;
	}

	/**
	 * Rate a recipe
	 */
	async rateRecipe(
		userId: number,
		recipeId: number,
		rating: number
	): Promise<{ upserted: boolean; rating: number }> {
		// Validate rating
		if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
			throw new ApiError('Rating must be an integer between 1 and 5', 400);
		}

		// Verify recipe exists
		const recipe = await this.recipeRepo.findById(recipeId);
		if (!recipe) {
			throw new ApiError('Recipe not found', 404);
		}

		// Create or update rating
		return await this.ratingRepo.upsertRating(userId, recipeId, rating);
	}

	/**
	 * Remove a recipe rating
	 */
	async removeRating(userId: number, recipeId: number): Promise<boolean> {
		return await this.ratingRepo.deleteRating(userId, recipeId);
	}

	/**
	 * Get recipe statistics including average rating
	 */
	async getRecipeStats(recipeId: number): Promise<{
		recipe: TransformedRecipe;
		averageRating: number | null;
		ratingCount: number;
		ratingDistribution: { [rating: number]: number };
	} | null> {
		const recipe = await this.recipeRepo.findById(recipeId);
		if (!recipe) return null;

		const ratingStats = await this.ratingRepo.getRatingStats(recipeId);

		return {
			recipe,
			averageRating: ratingStats?.average || null,
			ratingCount: ratingStats?.count || 0,
			ratingDistribution: ratingStats?.distribution || {}
		};
	}

	/**
	 * Get user's rated recipes
	 */
	async getUserRatedRecipes(userId: number): Promise<TransformedRecipe[]> {
		// Get user ratings
		const userRatings = await this.ratingRepo.getUserRatings(userId);
		const ratedRecipeIds = Array.from(userRatings.keys());

		if (ratedRecipeIds.length === 0) return [];

		// Get recipe details
		const recipes = await this.recipeRepo.findByIds(ratedRecipeIds);

		// Add user ratings
		return recipes.map((recipe) => ({
			...recipe,
			userRating: userRatings.get(recipe.id)
		}));
	}
}
