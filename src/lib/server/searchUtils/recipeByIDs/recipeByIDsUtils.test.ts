import { describe, it, expect } from 'vitest';
import {
	extractRecipeIds,
    parseIDs
} from './recipeByIDsUtils.ts';

const createTestURL = (urlString: string) => new URL(urlString);

describe('extractRecipeIds', () => {
	it('should extract recipe IDs from valid recipes data', () => {
		const sampleData = [
			{ id: 101, title: 'Recipe One' },
			{ id: 202, title: 'Recipe Two' },
			{ id: 303, title: 'Recipe Three' }
		];

		const result = extractRecipeIds(sampleData);

		expect(result.recipeIds).toEqual([101, 202, 303]);
		expect(result.errorResponse).toBeUndefined();
	});

	it('should return an error response when recipesData is empty', async () => {
		const sampleData: any[] = [];

		const result = extractRecipeIds(sampleData);

		expect(result.errorResponse).toBeDefined();
		if (result.errorResponse) {
			expect(result.errorResponse.status).toBe(404);
			const json = await result.errorResponse.json();
			expect(json).toEqual({ error: 'No recipes found for the provided ingredients' });
		}
	});

	it('should return an error response when recipesData has no valid ids', async () => {
		const sampleData = [{ name: 'No ID Recipe' }, { name: 'Another Recipe' }];

		const result = extractRecipeIds(sampleData);

		expect(result.errorResponse).toBeDefined();
		if (result.errorResponse) {
			expect(result.errorResponse.status).toBe(404);
			const json = await result.errorResponse.json();
			expect(json).toEqual({ error: 'No recipes found for the provided ingredients' });
		}
	});
});

describe('_parseIds', () => {
	describe('when IDs parameter is missing', () => {
		it('returns 400 error if IDs are missing', async () => {
			const url = createTestURL('http://localhost/api/getRecipe');
			const response = parseIDs(url) as Response;

			expect(response.status).toBe(400);
			expect(response.headers.get('Content-Type')).toBe('application/json');

			const json = await response.json();
			expect(json).toEqual({ error: 'Missing required parameter: ids' });
		});
	});

	describe('when IDs parameter exists', () => {
		it('returns raw Ids string', () => {
			const mockIDs = '123,456,789';

			const url = createTestURL(`http://localhost/api/getRecipe?ids=${encodeURIComponent(mockIDs)}`);
			expect(parseIDs(url)).toBe(mockIDs);
		});
	});
});