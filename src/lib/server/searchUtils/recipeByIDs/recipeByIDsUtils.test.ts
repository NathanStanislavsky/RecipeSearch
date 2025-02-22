import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractRecipeIds, constructBulkApiURL, fetchBulkRecipeInformation } from './recipeByIDsUtils.ts';

async function expectErrorResponse(
	response: Response | undefined,
	status: number,
	expectedJson: object
) {
	expect(response).toBeDefined();
	if (response) {
		expect(response.status).toBe(status);
		const json = await response.json();
		expect(json).toStrictEqual(expectedJson);
	}
}

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

	describe.each([
		{ caseName: 'when recipesData is empty', sampleData: [] },
		{
			caseName: 'when recipesData has no valid IDs',
			sampleData: [{ name: 'No ID Recipe' }, { name: 'Another Recipe' }]
		}
	])('$caseName', ({ sampleData }) => {
		it('should return an error response', async () => {
			const result = extractRecipeIds(sampleData);
			await expectErrorResponse(result.errorResponse, 404, {
				error: 'No recipes found for the provided ingredients'
			});
		});
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

	describe.each([
		{ caseName: 'when recipeIds array is empty', recipeIds: [] },
		{ caseName: 'when recipeIds is null', recipeIds: null as unknown as number[] }
	])('$caseName', ({ recipeIds }) => {
		it('should return a 400 Response', async () => {
			const result = constructBulkApiURL(recipeIds);
			await expectErrorResponse(result as Response, 400, {
				error: 'Missing or empty required parameter: ids'
			});
		});
	});
});

describe('fetchBulkRecipeInformation', () => {
	const testUrl = new URL('https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/informationBulk?ids=123,456,789');
	const mockFetch = vi.spyOn(global, 'fetch');

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should return a successful response when API returns 200', async () => {
		const mockResponseData = [{ id: 123, title: 'Recipe One' }];
		const mockResponse = new Response(JSON.stringify(mockResponseData), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});

		mockFetch.mockResolvedValueOnce(mockResponse);

		const result = await fetchBulkRecipeInformation(testUrl);
		expect(result.ok).toBe(true);
		expect(result.status).toBe(200);

		const json = await result.json();
		expect(json).toEqual(mockResponseData);
	});
});