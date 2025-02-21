import type { RequestHandler } from '@sveltejs/kit';
import { RAPIDAPI_KEY } from '$env/static/private';

export const _parseIngredients = (url: URL): string | Response => {
	const ingredients = url.searchParams.get('ingredients');
	if (!ingredients) {
		return new Response(JSON.stringify({ error: 'Missing required parameter: ingredients' }), {
			status: 400
		});
	}
	return ingredients;
};

export const _constructApiUrl = (ingredients: string): URL => {
	const apiUrl = new URL(
		'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByIngredients'
	);
	apiUrl.searchParams.append('ingredients', ingredients);
	return apiUrl;
};

export const _fetchRecipeByIngredients = async (apiUrl: URL): Promise<Response> => {
	const ingredientSearchResponse = await fetch(apiUrl.toString(), {
		method: 'GET',
		headers: {
			'x-rapidapi-key': RAPIDAPI_KEY,
			'x-rapidapi-host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com'
		} as HeadersInit
	});

	if (!ingredientSearchResponse.ok) {
		const errorText = await ingredientSearchResponse.text();
		return new Response(
			JSON.stringify({
				error: 'Failed to fetch recipes by ingredients from RapidAPI',
				status: ingredientSearchResponse.status,
				message: errorText
			}),
			{ status: ingredientSearchResponse.status }
		);
	}

	return ingredientSearchResponse;
};

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

	return new Response(JSON.stringify(ingredientSearchResponse), {
		status: 200
	});
};
