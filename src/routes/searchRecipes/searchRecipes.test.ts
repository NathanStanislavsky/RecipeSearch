import { describe, it, expect, vi } from 'vitest';
import { _parseIngredients } from './+server';
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

describe('GET handler', () => {
	it('should return error response if external API call fails', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValueOnce(
			new Response('External API error', { status: 500 })
		);

		const response = await GET({
			url: createTestURL('http://localhost/api/getRecipe?ingredients=tomato,cheese')
		});
		expect(response.status).toBe(500);

		const json = await response.json();
		expect(json).toEqual({
			error: 'Failed to fetch from RapidAPI',
			status: 500,
			message: 'External API error'
		});
	});
});
