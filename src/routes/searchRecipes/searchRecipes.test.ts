import { describe, it, expect, vi } from 'vitest';
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
