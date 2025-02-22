import { describe, it, expect } from 'vitest';
import { extractRecipeIds, constructBulkApiURL } from './recipeByIDsUtils.ts';

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

describe('constructBulkApiURL', () => {
    const BASE_URL =
        'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/informationBulk';

    it('should construct a valid bulk API URL when valid recipe IDs are provided', () => {
        const recipeIds = [123, 456, 789];
        const result = constructBulkApiURL(recipeIds);

        expect(result).toBeInstanceOf(URL);

        expect(decodeURIComponent(result.toString())).toBe(`${BASE_URL}?ids=123,456,789`);
    });

    it('should return a 400 Response when recipeIds array is empty', async () => {
        const result = constructBulkApiURL([]);

        expect(result).toBeInstanceOf(Response);
        expect((result as Response).status).toBe(400);

        const json = await (result as Response).json();
        expect(json).toStrictEqual({ error: 'Missing or empty required parameter: ids' });
    });

    it('should return a 400 Response when recipeIds is null or undefined', async () => {
        const result = constructBulkApiURL(null as unknown as number[]);

        expect(result).toBeInstanceOf(Response);
        expect((result as Response).status).toBe(400);

        const json = await (result as Response).json();
        expect(json).toStrictEqual({ error: 'Missing or empty required parameter: ids' });
    });
});