import type { RequestHandler } from '@sveltejs/kit';
import {
	extractRecipeIds,
	constructBulkApiURL,
	fetchBulkRecipeInformation,
	filterInformationBulkReponse
} from '$utils/search/recipeByIDs/recipeByIDUtils.js';
import {
	parseIngredients,
	fetchRecipeByIngredients,
	constructApiUrl
} from '$utils/search/recipeByIngredients/recipeByIngredientsUtils.js';
import { createJsonResponse } from '$utils/api/apiUtils.js';
import { ApiError, handleError } from '$utils/errors/AppError.js';

/**
 * GET handler for the search endpoint
 * Searches for recipes based on provided ingredients
 * @param {Object} params - The request parameters
 * @param {URL} params.url - The request URL containing search parameters
 * @returns {Promise<Response>} - JSON response with recipe data or error
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		// 1. Parse ingredients from the request URL
		const ingredientsOrResponse = parseIngredients(url);
		if (ingredientsOrResponse instanceof Response) {
			return ingredientsOrResponse;
		}
		const ingredients = ingredientsOrResponse;

		// 2. Construct the API URL to search recipes by ingredients
		const recipeByIngredientsUrl = constructApiUrl(ingredients);

		// 3. Fetch recipes based on ingredients
		const ingredientSearchResponse = await fetchRecipeByIngredients(recipeByIngredientsUrl);
		if (!ingredientSearchResponse.ok) {
			throw new ApiError('Failed to fetch recipes by ingredients', ingredientSearchResponse.status);
		}

		// 4. Extract recipe IDs from the fetched recipes
		const recipesData = await ingredientSearchResponse.json();
		const { recipeIds, errorResponse } = extractRecipeIds(recipesData);
		if (errorResponse) {
			return errorResponse;
		}

		// 5. Construct the bulk API URL using the extracted recipe IDs
		if (!recipeIds || recipeIds.length === 0) {
			return createJsonResponse([], 200); // Return empty array if no recipes found
		}

		const bulkApiUrlResponse = constructBulkApiURL(recipeIds);
		const bulkApiUrl = bulkApiUrlResponse as URL;

		// 6. Fetch detailed recipe information using the bulk API URL
		const bulkResponse = await fetchBulkRecipeInformation(bulkApiUrl);
		if (!bulkResponse.ok) {
			throw new ApiError('Failed to fetch detailed recipe information', bulkResponse.status);
		}

		// 7. Filter the detailed recipe information
		const finalResponse = await filterInformationBulkReponse(bulkResponse);
		return finalResponse;
	} catch (error) {
		const errorResponse = handleError(error, 'Recipe Search');
		return createJsonResponse(
			{
				error: errorResponse.error,
				message: errorResponse.message
			},
			errorResponse.status
		);
	}
};
