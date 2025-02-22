import { RAPIDAPI_KEY } from '$env/static/private';

export function extractRecipeIds(recipesData: any[]): {
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

export function constructBulkApiURL(recipeIds: number[]): Response | URL {
	if (!recipeIds || recipeIds.length === 0) {
		return new Response(JSON.stringify({ error: 'Missing or empty required parameter: ids' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const bulkUrl = new URL(
		'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/informationBulk'
	);
	bulkUrl.searchParams.append('ids', recipeIds.join(','));

	return bulkUrl;
}

export const fetchBulkRecipeInformation = async (url: URL): Promise<Response> => {
	const response = await fetch(url.toString(), {
		method: 'GET',
		headers: {
			'x-rapidapi-key': RAPIDAPI_KEY,
			'x-rapidapi-host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com',
			'Content-Type': 'application/json'
		}
	});

	if (!response.ok) {
		const errorMessage = await response.text();
		return new Response(
			JSON.stringify({
				error: 'Failed to fetch detailed recipe information',
				status: response.status,
				message: errorMessage
			}),
			{ status: response.status, headers: { 'Content-Type': 'application/json' } }
		);
	}

	return response;
};
