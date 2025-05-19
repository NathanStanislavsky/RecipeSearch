import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	parseIngredients,
	fetchRecipeByIngredients,
	constructApiUrl
} from './recipeByIngredientsUtils.js';
import { TestHelper } from '$utils/test/testHelper.js';
import { ApiError, ConfigError } from '../../errors/AppError.js';

const createTestURL = (urlString: string) => new URL(urlString);

describe('_parseIngredients', () => {
	describe('when ingredients parameter is missing', () => {
		it('returns 400 error if ingredients are missing', async () => {
			const url = new URL('http://localhost/api/getRecipe');
			const response = parseIngredients(url);
			expect(response instanceof Response).toBe(true);
			const json = await (response as Response).json();
			expect(json).toEqual({
				error: 'ValidationError',
				message: 'Missing required parameter: ingredients',
				code: 'VALIDATION_ERROR',
				status: 400
			});
		});
	});

	describe('when ingredients parameter exists', () => {
		it('returns raw ingredients string', () => {
			const url = createTestURL('http://localhost/api/getRecipe?ingredients=tomato,cheese');
			const result = parseIngredients(url);

			expect(result).toBe('tomato,cheese');
		});
	});
});

describe('_constructApiUrl', () => {
	const BASE_URL =
		'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByIngredients';

	it('constructs URL with default parameters when only ingredients provided', () => {
		const result = constructApiUrl('apples,bananas');
		const params = new URLSearchParams(result.search);

		expect(result.origin + result.pathname).toBe(BASE_URL);
		expect(params.get('ingredients')).toBe('apples,bananas');
	});

	it('URL-encodes special characters in ingredients', () => {
		const ingredients = 'chicken breast,red pepper & onion';
		const result = constructApiUrl(ingredients);
		expect(result.searchParams.get('ingredients')).toBe(ingredients);
	});
});

describe('_fetchRecipeByIngredients', () => {
	const TEST_URL = new URL(
		'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByIngredients?ingredients=apples,bananas'
	);

	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn();
		TestHelper.mockRateLimiter(true); // Allow API requests by default
	});

	describe('when API responds successfully', () => {
		it('should return a successful response for a valid URL', async () => {
			const mockData = {
				recipes: ['apple pie', 'banana pie']
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ mockData })
			});

			const response = await fetchRecipeByIngredients(TEST_URL);
			expect(response.ok).toBe(true);
			expect(await response.json()).toEqual({ mockData });
		});
	});

	describe('when API returns error status', () => {
		it('should return an error response for a failed fetch', async () => {
			TestHelper.setupMockFetch(TestHelper.createMockResponse('Internal Server Error', 500));

			try {
				await fetchRecipeByIngredients(TEST_URL);
				// Should not reach here
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(ApiError);
				const apiError = error as ApiError;
				expect(apiError.name).toBe('ApiError');
				expect(apiError.status).toBe(500);
			}
		});

		it('should handle rate limit exceeded', async () => {
			TestHelper.mockRateLimiter(false); // Simulate rate limit exceeded

			try {
				await fetchRecipeByIngredients(TEST_URL);
				// Should not reach here
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(ConfigError);
				const configError = error as ConfigError;
				expect(configError.name).toBe('ConfigError');
				expect(configError.message).toBe('Daily API request limit reached');
			}
		});
	});
});
