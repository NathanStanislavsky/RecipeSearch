import { env } from '$env/dynamic/private';
import { ConfigError, ApiError } from '../errors/AppError.js';
import { RateLimiter } from './rateLimiter.ts';

/** Base URL for the Spoonacular API */
export const SPOONACULAR_BASE_URL = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com';

/**
 * Gets the headers required for Spoonacular API requests
 * @returns Headers object with API key and content type
 * @throws ConfigError if API key is not set
 */
export const getSpoonacularHeaders = (): Record<string, string> => {
	if (!env.RAPIDAPI_KEY_2) {
		throw new ConfigError('RAPIDAPI_KEY_2 environment variable is not set');
	}

	return {
		'x-rapidapi-key': env.RAPIDAPI_KEY_2,
		'x-rapidapi-host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com',
		'Content-Type': 'application/json'
	};
};

/**
 * Creates a URL for the Spoonacular API
 * @param endpoint - The API endpoint to call
 * @returns The constructed URL
 */
export const createApiUrl = (endpoint: string): URL => {
	if (!endpoint.startsWith('/')) {
		endpoint = `/${endpoint}`;
	}
	return new URL(`${SPOONACULAR_BASE_URL}${endpoint}`);
};

/**
 * Handles API responses and standardizes error handling
 * @param response - The fetch Response object
 * @returns Either the original response or an error response
 */
export const handleApiResponse = async (apiURLString: string): Promise<Response> => {
	const canMakeRequest = await RateLimiter.checkAndIncrement();

	if (!canMakeRequest) {
		throw new ConfigError('Daily API request limit reached');
	}

	const response = await fetch(apiURLString, {
		method: 'GET',
		headers: getSpoonacularHeaders()
	});

	if (!response.ok) {
		throw new ApiError(response.statusText, response.status);
	}

	return response;
};

/**
 * Creates a standardized JSON response
 * @param data - The data to include in the response
 * @param status - The HTTP status code
 * @param headers - Additional headers to include
 * @returns A Response object with JSON content
 */
export const createJsonResponse = (
	data: unknown,
	status = 200,
	headers: HeadersInit = {}
): Response => {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...headers }
	});
};
