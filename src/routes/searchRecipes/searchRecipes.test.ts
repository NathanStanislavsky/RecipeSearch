import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET } from './+server.js';

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
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should return 400 if ingredients are missing', async () => {
		const response = await GET(mockRequestEvent('http://localhost/api/getRecipe'));
		expect(response.status).toBe(400);
		const json = await response.json();
		expect(json).toEqual({ error: 'Missing required parameter: ingredients' });
	});

	it('should return 500 if external API call fails on ingredients search', async () => {
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

	it('should return 404 if no valid recipe IDs are found', async () => {
		const mockRecipes = [{ title: 'Recipe Without ID' }, { title: 'Another Recipe' }];

		vi.spyOn(global, 'fetch').mockResolvedValueOnce(
			new Response(JSON.stringify(mockRecipes), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})
		);

		const response = await GET(
			mockRequestEvent('http://localhost/api/getRecipe?ingredients=tomato,cheese')
		);

		expect(response.status).toBe(404);
		const json = await response.json();
		expect(json).toEqual({ error: 'No recipes found for the provided ingredients' });
	});

	it('should return error response if fetching bulk recipe details fails', async () => {
		const mockIngredientsRecipes = [
			{ id: 1, title: 'Tomato Soup', image: 'tomato_soup.jpg' },
			{ id: 2, title: 'Tomato Salad', image: 'tomato_salad.jpg' }
		];

		const errorText = 'Bulk API error';

		vi.spyOn(global, 'fetch')
			.mockResolvedValueOnce(
				new Response(JSON.stringify(mockIngredientsRecipes), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				})
			)
			.mockResolvedValueOnce(
				new Response(errorText, {
					status: 500,
					headers: { 'Content-Type': 'text/plain' }
				})
			);

		const response = await GET(
			mockRequestEvent('http://localhost/api/getRecipe?ingredients=tomato,cheese')
		);

		expect(response.status).toBe(500);
		const json = await response.json();
		expect(json).toEqual({
			error: 'Failed to fetch detailed recipe information',
			status: 500,
			message: errorText
		});
	});
});
