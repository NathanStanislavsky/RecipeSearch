import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET } from './+server';

const createRequestEvent = (urlString: string) => ({ url: new URL(urlString) });

describe('GET searchRecipes/+server.ts', () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	it('should return 400 error if ingredient parameters were missing', async () => {
		const response = await GET(createRequestEvent('http://localhost/getRecipe'));
		expect(response.status).toBe(400);

		const json = await response.json();
		expect(json).toEqual({ error: 'Missing required parameter: ingredients' });
	});
});
