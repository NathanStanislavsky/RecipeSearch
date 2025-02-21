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

    return new Response(
        JSON.stringify({ message: `Received ingredients: ${ingredients}` }),
        { status: 200 }
    );
};