import type { RequestHandler } from '@sveltejs/kit';
import { createJsonResponse } from '$utils/api/apiUtils.js';
import { ApiError, handleError } from '$utils/errors/AppError.js';
import { getMongoClient } from '$lib/server/mongo/index.js';
import { MONGODB_DATABASE, MONGODB_COLLECTION, MONGODB_SEARCH_INDEX, MONGODB_REVIEWS_COLLECTION } from '$env/static/private';
import type { TransformedRecipe } from '../../types/recipe.js';

async function searchRecipes(
	searchQuery: string,
	limit = 50,
	skip = 0,
	userId?: string
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

		let userRatings: Map<string, number> = new Map();
		if (userId) {
			const reviewsCollection = database.collection(MONGODB_REVIEWS_COLLECTION);
			const ratingPipeline = [
				{ $match: { userId: userId, recipeId: { $exists: true } } },
				{ $project: { recipeId: 1, rating: 1 } }
			];

			const ratings = await reviewsCollection.aggregate(ratingPipeline).toArray();
			userRatings = new Map(ratings.map(r => [r.recipeId, r.rating]));
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
			userRating: userRatings.get((recipe.id as number).toString())
		}));

		return results;
	} catch (error) {
		console.error('Error during Atlas Search aggregation:', error);
		throw error;
	}
}

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const searchParams = url.searchParams;
		const query = searchParams.get('ingredients');

		if (!query) {
			throw new ApiError('Search query is required', 400);
		}

		const userId = locals.user?.id.toString();
		const results = await searchRecipes(query, 50, 0, userId);

		return createJsonResponse(
			{
				results,
				total: results.length,
				query
			},
			200
		);
	} catch (error) {
		const errorResponse = handleError(error, 'Ingredient Search');
		return createJsonResponse(
			{
				error: errorResponse.error,
				message: errorResponse.message
			},
			errorResponse.status
		);
	}
};
