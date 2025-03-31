import { createApiUrl, createJsonResponse, getSpoonacularHeaders, handleApiResponse } from '$utils/api/apiUtils.js';

export const parseIngredients = (url: URL): string | Response => {
    const ingredients = url.searchParams.get('ingredients');
    if (!ingredients) {
        return createJsonResponse({ error: 'Missing required parameter: ingredients' }, 400);
    }
    return ingredients;
};

export const constructApiUrl = (ingredients: string): URL => {
    const apiUrl = createApiUrl('/recipes/findByIngredients');
    apiUrl.searchParams.append('ingredients', ingredients);
    apiUrl.searchParams.append('number', '100');
    return apiUrl;
};

export const fetchRecipeByIngredients = async (apiUrl: URL): Promise<Response> => {
    const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: getSpoonacularHeaders()
    });
    return handleApiResponse(response);
};
