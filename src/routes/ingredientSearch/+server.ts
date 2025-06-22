import type { RequestHandler } from '@sveltejs/kit';
import { createJsonResponse } from '$utils/api/apiUtils.js';
import { ApiError, handleError } from '$utils/errors/AppError.js';
import { getMongoClient } from '$lib/server/mongo/index.js';

interface RecipeSearchResult {
	name: string;
	ingredients: string[];
	description: string;
	score: number;
}

async function searchRecipes(
	searchQuery: string,
	limit = 50,
	skip = 0
): Promise<RecipeSearchResult[]> {
	const client = getMongoClient();

	if (!client) {
		throw new ApiError('MongoDB client not found', 500);
	}

	try {
		const database = client.db(process.env.MONGODB_DATABASE);
		const recipesCollection = database.collection(process.env.MONGODB_COLLECTION || '');

		const pipeline = [
			{
				$search: {
					index: process.env.MONGODB_SEARCH_INDEX,
					text: {
						query: searchQuery,
						path: ['RecipeIngredientParts']
					}
				}
			},
			{ $sort: { score: -1 } },
			{ $skip: skip },
			{ $limit: limit }
		];

		const cursor = recipesCollection.aggregate(pipeline);
		const results: RecipeSearchResult[] = [];

		for await (const doc of cursor) {
			results.push(doc as RecipeSearchResult);
		}

		return results;
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
