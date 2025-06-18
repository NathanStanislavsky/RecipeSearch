import { createApiUrl, createJsonResponse, handleApiResponse } from '$utils/api/apiUtils.js';
import { ValidationError, ApiError, handleError } from '$utils/errors/AppError.js';

/**
 * Parses ingredients from the request URL
 * @param url - The request URL containing search parameters
 * @returns Either the ingredients string or an error Response
 */
export const parseIngredients = (url: URL): string | Response => {
	const ingredients = url.searchParams.get('ingredients');
	if (!ingredients) {
		const error = new ValidationError('Missing required parameter: ingredients');
		return createJsonResponse(handleError(error, 'Parse Ingredients'), 400);
	}
	return ingredients;
};

/**
 * Constructs the API URL for finding recipes by ingredients
 * @param ingredients - The ingredients to search for
 * @param limit - The maximum number of recipes to return (default: 20)
 * @returns The constructed API URL
 */
export const constructApiUrl = (ingredients: string, limit: number = 10): URL => {
	const apiUrl = createApiUrl('/recipes/findByIngredients');
	apiUrl.searchParams.append('ingredients', ingredients);
	apiUrl.searchParams.append('number', limit.toString());
	return apiUrl;
};

/**
 * Fetches recipes by ingredients from the Spoonacular API
 * @param apiUrl - The API URL to fetch from
 * @returns A Response object with the API response
 */
export const fetchRecipeByIngredients = async (apiUrl: URL): Promise<Response> => {
	try {
		return handleApiResponse(apiUrl.toString());
	} catch (error) {
		const apiError = new ApiError(error instanceof Error ? error.message : 'Network error', 500);
		return createJsonResponse(handleError(apiError, 'Fetch Recipes'), 500);
	}
};
