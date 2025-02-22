import type { RequestHandler } from '@sveltejs/kit';
import {
	_extractRecipeIds,
	_parseIDs
} from '$lib/server/searchUtils/recipeByIDs/recipeByIDsUtils.js';

import {
	_parseIngredients,
	_fetchRecipeByIngredients,
	_constructApiUrl
} from '$lib/server/searchUtils/recipeByIngredients/recipeByIngredientsUtils.js';


export const GET: RequestHandler = async ({ url }) => {
	const ingredientsOrResponse = _parseIngredients(url);
	if (ingredientsOrResponse instanceof Response) {
		return ingredientsOrResponse;
	}
	const ingredients = ingredientsOrResponse;

	const recipeByIngredientsUrl = _constructApiUrl(ingredients);

	const ingredientSearchResponse = await _fetchRecipeByIngredients(recipeByIngredientsUrl);
	if (ingredientSearchResponse instanceof Response) {
		return ingredientSearchResponse;
	}

	const recipesData = await ingredientSearchResponse.json();
	const { recipeIds } = _extractRecipeIds(recipesData);

	return new Response(JSON.stringify(ingredientSearchResponse), {
		status: 200
	});
};
