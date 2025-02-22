import type { RequestHandler } from '@sveltejs/kit';
import {
	extractRecipeIds,
	parseIDs
} from '$lib/server/searchUtils/recipeByIDs/recipeByIDsUtils.js';

import {
	parseIngredients,
	fetchRecipeByIngredients,
	constructApiUrl
} from '$lib/server/searchUtils/recipeByIngredients/recipeByIngredientsUtils.js';


export const GET: RequestHandler = async ({ url }) => {
	const ingredientsOrResponse = parseIngredients(url);
	if (ingredientsOrResponse instanceof Response) {
		return ingredientsOrResponse;
	}
	const ingredients = ingredientsOrResponse;

	const recipeByIngredientsUrl = constructApiUrl(ingredients);

	const ingredientSearchResponse = await fetchRecipeByIngredients(recipeByIngredientsUrl);
	if (ingredientSearchResponse instanceof Response) {
		return ingredientSearchResponse;
	}

	const recipesData = await ingredientSearchResponse.json();
	const { recipeIds } = extractRecipeIds(recipesData);

	return new Response(JSON.stringify(ingredientSearchResponse), {
		status: 200
	});
};
