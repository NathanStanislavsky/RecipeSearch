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

export function _extractRecipeIds(recipesData: any[]): {
    recipeIds?: number[];
    errorResponse?: Response;
} {
    const recipeIds = recipesData
        .map((recipe: any) => recipe.id)
        .filter((id) => id !== undefined && id !== null);

    if (recipeIds.length === 0) {
        const response = new Response(
            JSON.stringify({ error: 'No recipes found for the provided ingredients' }),
            { status: 404 }
        );
        return { errorResponse: response };
    }
    return { recipeIds };
}

export function _parseIDs(url: URL): Response | string {
	const ids = url.searchParams.get('ids');
  
	if (!ids) {
	  return new Response(
		JSON.stringify({ error: 'Missing required parameter: ids' }),
		{
		  status: 400,
		  headers: { 'Content-Type': 'application/json' }
		}
	  );
	}
  
	return ids;
  }

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
