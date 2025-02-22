import { RAPIDAPI_KEY } from '$env/static/private';

export const parseIngredients = (url: URL): string | Response => {
	const ingredients = url.searchParams.get('ingredients');
	if (!ingredients) {
		return new Response(JSON.stringify({ error: 'Missing required parameter: ingredients' }), {
			status: 400
		});
	}
	return ingredients;
};

export const constructApiUrl = (ingredients: string): URL => {
	const apiUrl = new URL(
		'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByIngredients'
	);
	apiUrl.searchParams.append('ingredients', ingredients);
	return apiUrl;
};

export const fetchRecipeByIngredients = async (apiUrl: URL): Promise<Response> => {
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
