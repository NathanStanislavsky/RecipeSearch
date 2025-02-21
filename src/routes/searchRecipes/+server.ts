import type { RequestHandler } from '@sveltejs/kit';
import { RAPIDAPI_KEY } from '$env/static/private';

export const _parseIngredients = (url: URL): string | Response => {
    const ingredients = url.searchParams.get('ingredients');
    if (!ingredients) {
        return new Response(
            JSON.stringify({ error: 'Missing required parameter: ingredients' }),
            { status: 400 }
        );
    }
    return ingredients;
};

export const GET: RequestHandler = async ({ url }) => {
    const ingredientsOrResponse = _parseIngredients(url);
    if (ingredientsOrResponse instanceof Response) {
        return ingredientsOrResponse;
    }
    const ingredients = ingredientsOrResponse;

    // Construct the external API URL
	const apiUrl = new URL(
		'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByIngredients'
	);
	apiUrl.searchParams.append('ingredients', ingredients);

	// Make the fetch call with the RapidAPI headers
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
				error: 'Failed to fetch from RapidAPI',
				status: ingredientSearchResponse.status,
				message: errorText
			}),
			{ status: ingredientSearchResponse.status }
		);
	}

    return new Response(
        JSON.stringify({ message: `Received ingredients: ${ingredients}` }),
        { status: 200 }
    );
};