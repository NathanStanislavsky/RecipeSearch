import { fail, type Actions } from '@sveltejs/kit';
import { ApiError, handleError } from '$utils/errors/AppError.js';
import { getMongoClient } from '$lib/server/mongo/index.js';
import {
	MONGODB_DATABASE,
	MONGODB_COLLECTION,
	MONGODB_SEARCH_INDEX,
	MONGODB_REVIEWS_COLLECTION
} from '$env/static/private';
import type { TransformedRecipe } from '../../types/recipe.ts';

async function searchRecipes(
	searchQuery: string,
	limit = 50,
	skip = 0,
	user_id?: number
): Promise<TransformedRecipe[]> {
	const client = getMongoClient();

	if (!client) {
		throw new ApiError('MongoDB client not found', 500);
	}

	try {
		const database = client.db(MONGODB_DATABASE);
		const recipesCollection = database.collection(MONGODB_COLLECTION);

		const searchPipeline = [
			{
				$search: {
					index: MONGODB_SEARCH_INDEX,
					text: {
						query: searchQuery,
						path: ['ingredients']
					}
				}
			},
			{ $addFields: { score: { $meta: 'searchScore' } } },
			{ $sort: { score: -1 } },
			{ $skip: skip },
			{ $limit: limit }
		];

		const searchResults = await recipesCollection.aggregate(searchPipeline).toArray();

		let userRatings: Map<number, number> = new Map();
		if (user_id) {
			const reviewsCollection = database.collection(MONGODB_REVIEWS_COLLECTION);
			const ratingPipeline = [
				{ $match: { user_id: String(user_id), recipe_id: { $exists: true } } },
				{ $project: { recipe_id: 1, rating: 1 } }
			];

			const ratings = await reviewsCollection.aggregate(ratingPipeline).toArray();
			userRatings = new Map(ratings.map((r) => [Number(r.recipe_id), r.rating]));
		}

		const results: TransformedRecipe[] = searchResults.map((recipe) => ({
			id: recipe.id as number,
			name: recipe.name as string,
			minutes: recipe.minutes as number,
			nutrition: recipe.nutrition as string,
			steps: recipe.steps as string,
			description: recipe.description as string,
			ingredients: recipe.ingredients as string,
			score: recipe.score as number,
			userRating: userRatings.get(recipe.id as number)
		}));

		return results;
	} catch (error) {
		console.error('Error during Atlas Search aggregation:', error);
		throw error;
	}
}

export const actions: Actions = {
	search: async ({ request, locals }) => {
		try {
			const formData = await request.formData();
			const query = formData.get('ingredients')?.toString();

			if (!query) {
				throw new ApiError('Search query is required', 400);
			}

			const user_id = locals.user?.id;
			const results = await searchRecipes(query, 50, 0, user_id);

			return {
				results,
				total: results.length,
				query
			};
		} catch (error) {
			const errorResponse = handleError(error, 'Ingredient Search');
			return fail(errorResponse.status, { message: errorResponse.message });
		}
	},
	addRating: async ({ request, locals }) => {
		try {
			const formData = await request.formData();
			const recipe_id = formData.get('recipe_id')?.toString();
			const rating = formData.get('rating');

			if (!recipe_id || !rating) {
				throw new ApiError('Recipe ID and rating are required', 400);
			}

			const user_id = locals.user?.id?.toString();

			if (!user_id) {
				throw new ApiError('User not authenticated', 401);
			}

			const client = getMongoClient();
			if (!client) {
				throw new ApiError('Failed to connect to MongoDB', 500);
			}

			const db = client.db(MONGODB_DATABASE);
			const collection = db.collection(MONGODB_REVIEWS_COLLECTION);

			const result = await collection.updateOne(
				{ recipe_id, user_id },
				{ $set: { rating: Number(rating) } },
				{ upsert: true }
			);

			return {
				message: result.upsertedCount > 0 ? 'Rating created' : 'Rating updated',
				recipe_id,
				rating,
				upserted: result.upsertedCount > 0
			};
		} catch (error) {
			const errorResponse = handleError(error, 'Add Rating');
			return fail(errorResponse.status, { message: errorResponse.message });
		}
	}
};
