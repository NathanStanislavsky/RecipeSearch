import { describe, it, expect, vi } from 'vitest';
import { _parseIngredients, _fetchRecipeByIngredients, _constructApiUrl } from './+server';
import { GET } from './+server';

const createTestURL = (urlString: string) => new URL(urlString);

describe('parseIngredients function', () => {
	it('should return a 400 error response if ingredients parameter is missing', async () => {
		const url = createTestURL('http://localhost/api/getRecipe');
		const response = _parseIngredients(url);

		expect(response).toBeInstanceOf(Response);
		expect(response.status).toBe(400);

		const json = await response.json();
		expect(json).toEqual({ error: 'Missing required parameter: ingredients' });
	});

	it('should return the ingredients string when provided', () => {
		const url = createTestURL('http://localhost/api/getRecipe?ingredients=tomato,cheese');
		const result = _parseIngredients(url);

		expect(result).toBe('tomato,cheese');
	});
});

describe('_constructApiUrl', () => {
	it('should construct a valid API URL with ingredients', () => {
		const ingredients = 'apples,bananas';
		const expectedUrl = new URL(
			'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByIngredients'
		);
		expectedUrl.searchParams.append('ingredients', ingredients);

		const result = _constructApiUrl(ingredients);
		expect(result.toString()).toBe(expectedUrl.toString());
	});
});

describe('_fetchRecipeByIngredients', () => {
	it('should return a successful response for a valid URL', async () => {
		const apiUrl = new URL(
			'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByIngredients?ingredients=apples,bananas'
		);

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ recipes: ["apple pie", "banana pie"] })
		});

		const response = await _fetchRecipeByIngredients(apiUrl);
		expect(response.ok).toBe(true);
		expect(await response.json()).toEqual({ recipes: ["apple pie", "banana pie"] });
	});

	it('should return an error response for a failed fetch', async () => {
		const apiUrl = new URL(
			'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByIngredients?ingredients=apples,bananas'
		);

		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500,
			text: async () => 'Internal Server Error'
		});

		const response = await _fetchRecipeByIngredients(apiUrl);
		expect(response.ok).toBe(false);
		expect(await response.json()).toEqual({
			error: 'Failed to fetch recipes by ingredients from RapidAPI',
			status: 500,
			message: 'Internal Server Error'
		});
	});
});


describe('GET handler', () => {
	it('should return 400 if ingredients are missing', async () => {
		const response = await GET({ url: createTestURL('http://localhost/api/getRecipe') });
		expect(response.status).toBe(400);
		const json = await response.json();
		expect(json).toEqual({ error: 'Missing required parameter: ingredients' });
	});

	it('should return 500 if external API call fails', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValueOnce(
			new Response('External API error', { status: 500 })
		);

		const response = await GET({
			url: createTestURL('http://localhost/api/getRecipe?ingredients=tomato,cheese')
		});
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

		const response = await GET({
			url: createTestURL('http://localhost/api/getRecipe?ingredients=tomato,cheese')
		});
		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json).toEqual(mockRecipes);
	});
});
