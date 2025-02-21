import { describe, it, expect, vi, beforeEach } from 'vitest';
import { _parseIngredients, _fetchRecipeByIngredients, _constructApiUrl } from './+server.js';
import { GET } from './+server.js';

const createTestURL = (urlString: string) => new URL(urlString);

describe('_parseIngredients', () => {
	describe('when ingredients parameter is missing', () => {
		it('returns 400 error if ingredients are missing', async () => {
			const url = createTestURL('http://localhost/api/getRecipe');
			const response = _parseIngredients(url);

			expect((response as Response).status).toBe(400);
			expect(response).toBeInstanceOf(Response);

			const json = await (response as Response).json();
			expect(json).toEqual({ error: 'Missing required parameter: ingredients' });
		});
	});

	describe('when ingredients parameter exists', () => {
		it('returns raw ingredients string', () => {
			const url = createTestURL('http://localhost/api/getRecipe?ingredients=tomato,cheese');
			const result = _parseIngredients(url);

			expect(result).toBe('tomato,cheese');
		});
	});
});

describe('_constructApiUrl', () => {
	const BASE_URL =
		'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByIngredients';

	it('constructs URL with default parameters when only ingredients provided', () => {
		const result = _constructApiUrl('apples,bananas');
		const params = new URLSearchParams(result.search);

		expect(result.origin + result.pathname).toBe(BASE_URL);
		expect(params.get('ingredients')).toBe('apples,bananas');
	});

	it('URL-encodes special characters in ingredients', () => {
		const ingredients = 'chicken breast,red pepper & onion';
		const result = _constructApiUrl(ingredients);
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

			const response = await _fetchRecipeByIngredients(TEST_URL);
			expect(response.ok).toBe(true);
			expect(await response.json()).toEqual({ mockData });
		});
	});

	describe('when API returns error status', () => {
		it('should return an error response for a failed fetch', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				text: async () => 'Internal Server Error'
			});

			const response = await _fetchRecipeByIngredients(TEST_URL);
			expect(response.ok).toBe(false);
			expect(await response.json()).toEqual({
				error: 'Failed to fetch recipes by ingredients from RapidAPI',
				status: 500,
				message: 'Internal Server Error'
			});
		});
	});
});

function mockRequestEvent(urlString: string): any {
	return {
		url: new URL(urlString),
		fetch: global.fetch,
		params: {},
		request: new Request(urlString),
		locals: {},
		cookies: {
			get: vi.fn(),
			set: vi.fn(),
			delete: vi.fn()
		},
		platform: undefined
	};
}

describe('GET handler integration tests', () => {
	it('should return 400 if ingredients are missing', async () => {
		const response = await GET(mockRequestEvent('http://localhost/api/getRecipe'));
		expect(response.status).toBe(400);
		const json = await response.json();
		expect(json).toEqual({ error: 'Missing required parameter: ingredients' });
	});

	it('should return 500 if external API call fails', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValueOnce(
			new Response('External API error', { status: 500 })
		);

		const response = await GET(
			mockRequestEvent('http://localhost/api/getRecipe?ingredients=tomato,cheese')
		);
		expect(response.status).toBe(500);
		const json = await response.json();
		expect(json).toEqual({
			error: 'Failed to fetch recipes by ingredients from RapidAPI',
			status: 500,
			message: 'External API error'
		});
	});

	it('should return 200 with recipes if API call succeeds', async () => {
		const mockRecipes = [
			{ id: 1, title: 'Tomato Soup', image: 'tomato_soup.jpg' },
			{ id: 2, title: 'Tomato Salad', image: 'tomato_salad.jpg' }
		];

		vi.spyOn(global, 'fetch').mockResolvedValueOnce(
			new Response(JSON.stringify(mockRecipes), { status: 200 })
		);

		const response = await GET(
			mockRequestEvent('http://localhost/api/getRecipe?ingredients=tomato,cheese')
		);
		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json).toEqual(mockRecipes);
	});
});
