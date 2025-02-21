import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET } from './+server';

describe('GET searchRecipes/+server.ts', () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	it('should return 400 error if ingredient parameters were missing', async () => {
		const mockEvent = {
			url: new URL('http://localhost/getRecipe')
		};

		const response = await GET(mockEvent as any);
		expect(response.status).toBe(400);

		const json = await response.json();
		expect(json).toEqual({ error: 'Missing required parameter: ingredients' });
	});
});
