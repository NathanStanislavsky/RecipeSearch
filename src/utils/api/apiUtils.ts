import { env } from '$env/dynamic/private';

export const SPOONACULAR_BASE_URL = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com';

export const getSpoonacularHeaders = () => ({
    'x-rapidapi-key': env.RAPIDAPI_KEY,
    'x-rapidapi-host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com',
    'Content-Type': 'application/json'
});

export const createApiUrl = (endpoint: string): URL => {
    return new URL(`${SPOONACULAR_BASE_URL}${endpoint}`);
};

export const handleApiResponse = async (response: Response): Promise<Response> => {
    if (!response.ok) {
        const errorText = await response.text();
        return createJsonResponse(
            {
                error: 'Failed to fetch data from RapidAPI',
                status: response.status,
                message: errorText
            },
            response.status
        );
    }
    return response;
};

export const createJsonResponse = (data: unknown, status = 200, headers: HeadersInit = {}) => {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...headers }
    });
};
