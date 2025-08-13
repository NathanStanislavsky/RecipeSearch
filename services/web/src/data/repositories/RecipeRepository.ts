import { getMongoClient } from '../connections/mongodb.js';
import { MONGODB_DATABASE, MONGODB_COLLECTION, MONGODB_SEARCH_INDEX } from '$env/static/private';
import type { TransformedRecipe, RecipeSearchOptions } from '../models/Recipe.js';
import { ApiError } from '$utils/errors/AppError.js';

export class RecipeRepository {
	private async getCollection() {
		const client = getMongoClient();
		if (!client) {
			throw new ApiError('MongoDB client not available', 500);
		}
		return client.db(MONGODB_DATABASE).collection(MONGODB_COLLECTION);
	}

	/**
	 * Search recipes by ingredients using MongoDB Atlas Search
	 */
	async searchByIngredients(
		query: string,
		options: RecipeSearchOptions = {}
	): Promise<TransformedRecipe[]> {
		const collection = await this.getCollection();
		const { limit = 50, skip = 0 } = options;

		const pipeline = [
			{
				$search: {
					index: MONGODB_SEARCH_INDEX,
					text: {
						query: query,
						path: ['ingredients']
					}
				}
			},
			{ $addFields: { score: { $meta: 'searchScore' } } },
			{ $sort: { score: -1 } },
			{ $skip: skip },
			{ $limit: limit }
		];

		try {
			const results = await collection.aggregate(pipeline).toArray();
			return results.map((recipe) => ({
				id: recipe.id as number,
				name: recipe.name as string,
				minutes: recipe.minutes as number,
				nutrition: recipe.nutrition as string,
				steps: recipe.steps as string,
				description: recipe.description as string,
				ingredients: recipe.ingredients as string
			}));
		} catch (error) {
			console.error('Error searching recipes by ingredients:', error);
			throw error;
		}
	}

	/**
	 * Find recipes by their IDs
	 */
	async findByIds(recipeIds: number[]): Promise<TransformedRecipe[]> {
		const collection = await this.getCollection();

		try {
			const recipes = await collection
				.find({ id: { $in: recipeIds.map((id) => Number(id)) } })
				.toArray();

			const recipeMap = new Map(recipes.map((recipe) => [recipe.id, recipe]));
			
			const orderedRecipes = recipeIds.map((id) => {
				const found = recipeMap.get(Number(id));
				return found;
			}).filter((recipe): recipe is NonNullable<typeof recipe> => recipe !== undefined);

			return orderedRecipes.map((recipe) => ({
				id: recipe.id as number,
				name: recipe.name as string,
				minutes: recipe.minutes as number,
				nutrition: recipe.nutrition as string,
				steps: recipe.steps as string,
				description: recipe.description as string,
				ingredients: recipe.ingredients as string
			}));
		} catch (error) {
			console.error('Error fetching recipes by IDs:', error);
			throw error;
		}
	}

	/**
	 * Find a single recipe by ID
	 */
	async findById(recipeId: number): Promise<TransformedRecipe | null> {
		const collection = await this.getCollection();

		try {
			const recipe = await collection.findOne({ id: Number(recipeId) });
			if (!recipe) return null;

			return {
				id: recipe.id as number,
				name: recipe.name as string,
				minutes: recipe.minutes as number,
				nutrition: recipe.nutrition as string,
				steps: recipe.steps as string,
				description: recipe.description as string,
				ingredients: recipe.ingredients as string
			};
		} catch (error) {
			console.error('Error fetching recipe by ID:', error);
			throw error;
		}
	}

	/**
	 * Get recipe count for search results
	 */
	async getSearchCount(query: string): Promise<number> {
		const collection = await this.getCollection();

		const pipeline = [
			{
				$search: {
					index: MONGODB_SEARCH_INDEX,
					text: {
						query: query,
						path: ['ingredients']
					}
				}
			},
			{ $count: 'total' }
		];

		try {
			const result = await collection.aggregate(pipeline).toArray();
			return result.length > 0 ? result[0].total : 0;
		} catch (error) {
			console.error('Error getting search count:', error);
			throw error;
		}
	}
}
