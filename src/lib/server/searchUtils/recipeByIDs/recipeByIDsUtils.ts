import { RAPIDAPI_KEY } from '$env/static/private';

interface ExtractRecipeIdsResult {
	recipeIds?: number[];
	errorResponse?: Response;
}

function createJSONResponse(body: object, status: number): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

export function extractRecipeIds(recipesData: any[]): ExtractRecipeIdsResult {
	const recipeIds = recipesData.map((recipe) => recipe.id).filter((id) => id != null); // null or undefined check

	if (recipeIds.length === 0) {
		return {
			errorResponse: createJSONResponse(
				{ error: 'No recipes found for the provided ingredients' },
				404
			)
		};
	}
	return { recipeIds };
}

export function constructBulkApiURL(recipeIds: number[]): Response | URL {
	if (!recipeIds?.length) {
		return createJSONResponse({ error: 'Missing or empty required parameter: ids' }, 400);
	}

	const bulkUrl = new URL(
		'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/informationBulk'
	);
	bulkUrl.searchParams.append('ids', recipeIds.join(','));

	return bulkUrl;
}

export async function fetchBulkRecipeInformation(url: URL): Promise<Response> {
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
		return createJSONResponse(
			{
				error: 'Failed to fetch detailed recipe information',
				status: response.status,
				message: errorMessage
			},
			response.status
		);
	}

	return response;
}

export async function filterInformationBulkReponse(bulkResponse: Response): Promise<Response> {
	if (!bulkResponse.ok) {
		return bulkResponse;
	}

	const detailedRecipes = await bulkResponse.json();

	const filteredRecipes = detailedRecipes.map((recipe: any) => ({
		id: recipe.id,
		image: recipe.image,
		title: recipe.title,
		readyInMinutes: recipe.readyInMinutes,
		servings: recipe.servings,
		sourceUrl: recipe.sourceUrl
	}));

	return new Response(JSON.stringify(filteredRecipes), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
}
