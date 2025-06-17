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

export const GET: RequestHandler = async ({ url }) => {
	try {
		const ingredientsOrResponse = parseIngredients(url);
		if (ingredientsOrResponse instanceof Response) {
			return ingredientsOrResponse;
		}
		const ingredients = ingredientsOrResponse;

		const recipeByIngredientsUrl = constructApiUrl(ingredients);

		const ingredientSearchResponse = await fetchRecipeByIngredients(recipeByIngredientsUrl);
		if (!ingredientSearchResponse.ok) {
			throw new ApiError('Failed to fetch recipes by ingredients', ingredientSearchResponse.status);
		}

		const recipesData = await ingredientSearchResponse.json();
		const { recipeIds, errorResponse } = extractRecipeIds(recipesData);
		if (errorResponse) {
			return errorResponse;
		}

		if (!recipeIds || recipeIds.length === 0) {
			return createJsonResponse([], 200);
		}

		const bulkApiUrlResponse = constructBulkApiURL(recipeIds);
		const bulkApiUrl = bulkApiUrlResponse as URL;

		const bulkResponse = await fetchBulkRecipeInformation(bulkApiUrl);
		if (!bulkResponse.ok) {
			throw new ApiError('Failed to fetch detailed recipe information', bulkResponse.status);
		}

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
