import { createApiUrl, createJsonResponse, handleApiResponse } from '$utils/api/apiUtils.js';
import type { ExtractRecipeIdsResult } from '../../../types/recipe.ts';
import type { BasicRecipe } from '../../../types/recipe.ts';
import type { DetailedRecipe } from '../../../types/recipe.ts';

export function extractRecipeIds(recipesData: BasicRecipe[]): ExtractRecipeIdsResult {
	const recipeIds = recipesData
		.map((recipe) => recipe.id)
		.filter((id) => typeof id === 'number' && id > 0);

	if (recipeIds.length === 0) {
		return {
			errorResponse: createJsonResponse(
				{ error: 'No recipes found for the provided ingredients' },
				404
			)
		};
	}
	return { recipeIds };
}

export function constructBulkApiURL(recipeIds: number[]): Response | URL {
	if (!recipeIds?.length) {
		return createJsonResponse({ error: 'Missing or empty required parameter: ids' }, 400);
	}

	const bulkUrl = createApiUrl('/recipes/informationBulk');
	bulkUrl.searchParams.append('ids', recipeIds.join(','));

	return bulkUrl;
}

export async function fetchBulkRecipeInformation(apiUrl: URL): Promise<Response> {
	return handleApiResponse(apiUrl.toString());
}

export async function filterInformationBulkReponse(bulkResponse: Response): Promise<Response> {
	if (!bulkResponse.ok) {
		return bulkResponse;
	}

	const detailedRecipes = await bulkResponse.json();

	const filteredRecipes = detailedRecipes.map((recipe: DetailedRecipe) => ({
		id: recipe.id,
		image: recipe.image,
		title: recipe.title,
		readyInMinutes: recipe.readyInMinutes,
		servings: recipe.servings,
		sourceUrl: recipe.sourceUrl
	}));

	return createJsonResponse(filteredRecipes, 200);
}
