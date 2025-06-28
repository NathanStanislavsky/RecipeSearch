import type { RequestHandler } from '@sveltejs/kit';
import { createJsonResponse } from '$utils/api/apiUtils.js';
import { ApiError, handleError } from '$utils/errors/AppError.js';
import { getMongoClient } from '$lib/server/mongo/index.js';
import type { MongoRecipe, Recipe } from '../../types/recipe.js';

/**
 * Extracts the first image URL from MongoDB Images field
 * Format: c("url1", "url2", ...) or just a plain URL
 */
function extractImageUrl(images?: string | number | null | undefined): string {
	if (!images) return '/favicon.png'; // fallback image
	
	// Convert to string and handle different types
	const imageStr = String(images);
	
	// Handle c("url1", "url2", ...) format
	if (imageStr.startsWith('c(')) {
		const match = imageStr.match(/c\("([^"]+)"/);
		if (match && match[1]) {
			return match[1];
		}
	}
	
	// Handle plain URL
	if (imageStr.startsWith('http')) {
		return imageStr;
	}
	
	return '/favicon.png'; // fallback
}

/**
 * Converts ISO 8601 duration (PT30M) to minutes
 */
function parseDurationToMinutes(duration?: string | number | null): number {
	if (!duration) return 0;
	
	// Convert to string and handle different types
	const durationStr = String(duration);
	const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
	if (!match) return 0;
	
	const hours = parseInt(match[1] || '0', 10);
	const minutes = parseInt(match[2] || '0', 10);
	
	return hours * 60 + minutes;
}

/**
 * Extracts serving count from RecipeServings or RecipeYield
 */
function extractServings(servings?: string | number, yield_?: string | number): number {
	// Convert to string and handle different types
	const servingStr = String(servings || yield_ || '');
	const match = servingStr.match(/\d+/);
	return match ? parseInt(match[0], 10) : 1;
}

/**
 * Transforms MongoDB recipe to frontend Recipe format
 */
function transformMongoRecipe(mongoRecipe: MongoRecipe): Recipe {
	const cookTimeMinutes = parseDurationToMinutes(mongoRecipe.CookTime);
	const prepTimeMinutes = parseDurationToMinutes(mongoRecipe.PrepTime);
	const totalMinutes = cookTimeMinutes + prepTimeMinutes;

	return {
		id: mongoRecipe._id,
		title: mongoRecipe.Name,
		image: extractImageUrl(mongoRecipe.Images),
		readyInMinutes: totalMinutes || 30, // fallback to 30 minutes
		servings: extractServings(mongoRecipe.RecipeServings, mongoRecipe.RecipeYield),
		sourceUrl: `#recipe-${mongoRecipe._id}` // placeholder URL, can be updated based on your needs
	};
}

async function searchRecipes(searchQuery: string, limit = 50, skip = 0): Promise<Recipe[]> {
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
			{ $addFields: { score: { $meta: 'searchScore' } } },
			{ $sort: { score: -1 } },
			{ $skip: skip },
			{ $limit: limit }
		];

		const cursor = recipesCollection.aggregate(pipeline);
		const results: Recipe[] = [];

		for await (const doc of cursor) {
			const mongoRecipe = doc as MongoRecipe;
			const transformedRecipe = transformMongoRecipe(mongoRecipe);
			results.push(transformedRecipe);
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
