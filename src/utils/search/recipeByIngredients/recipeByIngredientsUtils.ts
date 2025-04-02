import {
	createApiUrl,
	createJsonResponse,
	getSpoonacularHeaders,
	handleApiResponse
} from '$utils/api/apiUtils.js';

/**
 * Parses ingredients from the request URL
 * @param url - The request URL containing search parameters
 * @returns Either the ingredients string or an error Response
 */
export const parseIngredients = (url: URL): string | Response => {
	const ingredients = url.searchParams.get('ingredients');
	if (!ingredients) {
		return createJsonResponse(
			{
				error: 'Missing required parameter: ingredients'
			},
			400
		);
	}
	return ingredients;
};

/**
 * Constructs the API URL for finding recipes by ingredients
 * @param ingredients - The ingredients to search for
 * @param limit - The maximum number of recipes to return (default: 20)
 * @returns The constructed API URL
 */
export const constructApiUrl = (ingredients: string, limit: number = 100): URL => {
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
		const response = await fetch(apiUrl.toString(), {
			method: 'GET',
			headers: getSpoonacularHeaders()
		});
		return handleApiResponse(response);
	} catch (error) {
		console.error('Error fetching recipes by ingredients:', error);
		return createJsonResponse(
			{
				error: 'Failed to fetch recipes',
				message: error instanceof Error ? error.message : 'Network error'
			},
			500
		);
	}
};
