import type { RequestHandler } from '@sveltejs/kit';
import {
	extractRecipeIds,
	constructBulkApiURL,
	fetchBulkRecipeInformation,
	filterInformationBulkReponse
} from '$lib/server/searchUtils/recipeByIDs/recipeByIDUtils.ts';
import {
	parseIngredients,
	fetchRecipeByIngredients,
	constructApiUrl
} from '$lib/server/searchUtils/recipeByIngredients/recipeByIngredientsUtils.ts';

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
	const { recipeIds, errorResponse } = extractRecipeIds(recipesData);
	if (errorResponse) {
		return errorResponse;
	}

	// 5. Construct the bulk API URL using the extracted recipe IDs
	const bulkApiUrlResponse = constructBulkApiURL(recipeIds!);
	const bulkApiUrl = bulkApiUrlResponse as URL;

	// 6. Fetch detailed recipe information using the bulk API URL
	const bulkResponse = await fetchBulkRecipeInformation(bulkApiUrl);
	if (!bulkResponse.ok) {
		return bulkResponse;
	}

	// 7. Filter the detailed recipe information
	const finalResponse = await filterInformationBulkReponse(bulkResponse);
	return finalResponse;
};
