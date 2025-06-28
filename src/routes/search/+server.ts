import type { RequestHandler } from '@sveltejs/kit';
import { createJsonResponse } from '$utils/api/apiUtils.js';
import { ApiError, handleError } from '$utils/errors/AppError.js';
import { getMongoClient } from '$lib/server/mongo/index.js';
import { MONGODB_DATABASE, MONGODB_COLLECTION, MONGODB_SEARCH_INDEX } from '$env/static/private';
import type { Recipe, TransformedRecipe } from '../../types/recipe.js';

async function transformResults(results: Recipe[]): Promise<TransformedRecipe[]> {
	return results.map((result) => {
		return {
			id: result.id,
			name: result.name,
			minutes: result.minutes,
			nutrition: result.nutrition,
			steps: result.steps,
			description: result.description,
			ingredients: result.ingredients,
			score: result.score,
		};
	});
}

async function searchRecipes(searchQuery: string, limit = 50, skip = 0): Promise<TransformedRecipe[]> {
	const client = getMongoClient();

	if (!client) {
		throw new ApiError('MongoDB client not found', 500);
	}

	try {
		const database = client.db(MONGODB_DATABASE);
		const recipesCollection = database.collection(MONGODB_COLLECTION);

		const pipeline = [
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

		const cursor = recipesCollection.aggregate(pipeline);
		const results: Recipe[] = [];

		for await (const doc of cursor) {
			results.push(doc as Recipe);
		}

		return transformResults(results);
	} catch (error) {
		console.error('Error during Atlas Search aggregation:', error);
		throw error;
	}
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		const searchParams = url.searchParams;
		const query = searchParams.get('ingredients');

		if (!query) {
			throw new ApiError('Search query is required', 400);
		}

		const results = await searchRecipes(query);

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
