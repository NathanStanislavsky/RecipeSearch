import type { RequestHandler } from '@sveltejs/kit';
import {
	extractRecipeIds,
	constructBulkApiURL,
	fetchBulkRecipeInformation,
	filterInformationBulkReponse
} from '$lib/server/searchUtils/recipeByIDs/recipeByIDsUtils.js';
import {
	parseIngredients,
	fetchRecipeByIngredients,
	constructApiUrl
} from '$lib/server/searchUtils/recipeByIngredients/recipeByIngredientsUtils.js';

export const GET: RequestHandler = async ({ url }) => {
	// 1. Parse ingredients from the request URL
	const ingredientsOrResponse = parseIngredients(url);
	if (ingredientsOrResponse instanceof Response) {
		return ingredientsOrResponse;
	}
	const ingredients = ingredientsOrResponse;

	// 2. Construct the API URL to search recipes by ingredients
	const recipeByIngredientsUrl = constructApiUrl(ingredients);

	// 3. Fetch recipes based on ingredients.
	const ingredientSearchResponse = await fetchRecipeByIngredients(recipeByIngredientsUrl);
	if (!ingredientSearchResponse.ok) {
		return ingredientSearchResponse;
	}

	// 4. Extract recipe IDs from the fetched recipes
	const recipesData = await ingredientSearchResponse.json();
	const { errorResponse } = extractRecipeIds(recipesData);
	if (errorResponse) {
		return errorResponse;
	}
};