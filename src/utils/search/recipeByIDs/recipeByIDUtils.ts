import { createApiUrl, createJsonResponse, getSpoonacularHeaders, handleApiResponse } from '$utils/api/apiUtils.js';

interface ExtractRecipeIdsResult {
    recipeIds?: number[];
    errorResponse?: Response;
}

export function extractRecipeIds(recipesData: any[]): ExtractRecipeIdsResult {
    const recipeIds = recipesData.map((recipe) => recipe.id).filter((id) => id != null); // null or undefined check

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

export async function fetchBulkRecipeInformation(url: URL): Promise<Response> {
    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: getSpoonacularHeaders()
    });
    return handleApiResponse(response);
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

    return createJsonResponse(filteredRecipes, 200);
}
