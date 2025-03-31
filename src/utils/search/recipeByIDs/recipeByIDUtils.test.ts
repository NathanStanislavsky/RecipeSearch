import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
	extractRecipeIds,
	constructBulkApiURL,
	fetchBulkRecipeInformation,
	filterInformationBulkReponse
} from './recipeByIDUtils.ts';

import { createMockResponse, assertResponse } from '../../test/mockUtils';

describe('recipeByIDsUtils', () => {
	describe('extractRecipeIds', () => {
		it('extracts recipe IDs from valid data', () => {
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
			['empty recipesData', []],
			['data with no valid IDs', [{ name: 'No ID Recipe' }, { name: 'Another Recipe' }]]
		])('when %s', (_, sampleData) => {
			it('returns an error response', async () => {
				const result = extractRecipeIds(sampleData);
				await assertResponse(result.errorResponse, 404, {
					error: 'No recipes found for the provided ingredients'
				});
			});
		});
	});

	describe('constructBulkApiURL', () => {
		const BASE_URL =
			'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/informationBulk';

		it('constructs a valid bulk API URL with valid IDs', () => {
			const recipeIds = [123, 456, 789];
			const result = constructBulkApiURL(recipeIds);
			expect(result).toBeInstanceOf(URL);
			expect(decodeURIComponent(result.toString())).toBe(`${BASE_URL}?ids=123,456,789`);
		});

		describe.each([
			['an empty recipeIds array', []],
			['a null recipeIds', null as unknown as number[]]
		])('when %s', (_, recipeIds) => {
			it('returns a 400 error Response', async () => {
				const result = constructBulkApiURL(recipeIds);
				await assertResponse(result as Response, 400, {
					error: 'Missing or empty required parameter: ids'
				});
			});
		});
	});

	describe('fetchBulkRecipeInformation', () => {
		const testUrl = new URL(
			'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/informationBulk?ids=123,456,789'
		);
		let mockFetch: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			mockFetch = vi.spyOn(global, 'fetch');
		});
		afterEach(() => {
			vi.restoreAllMocks();
		});

		it('returns a successful response when API returns 200', async () => {
			const mockData = [{ id: 123, title: 'Recipe One' }];
			const mockResponse = createMockResponse(mockData, 200);
			mockFetch.mockResolvedValueOnce(mockResponse);

			const response = await fetchBulkRecipeInformation(testUrl);
			expect(response.ok).toBe(true);
			expect(response.status).toBe(200);

			const json = await response.json();
			expect(json).toEqual(mockData);
		});

		it('returns error response when bulk API call fails', async () => {
			// Simulate a failing fetch call with plain text error message.
			const errorText = 'Bulk API error';
			const failingResponse = new Response(errorText, {
				status: 500,
				headers: { 'Content-Type': 'text/plain' }
			});
			mockFetch.mockResolvedValueOnce(failingResponse);

			const response = await fetchBulkRecipeInformation(testUrl);
			expect(response.status).toBe(500);

			const json = await response.json();
			expect(json).toEqual({
				error: 'Failed to fetch data from RapidAPI',
				status: 500,
				message: errorText
			});
		});
	});

	describe('filter information bulk response', () => {
		let bulkResponse: Response;

		describe('when bulkResponse is successful', () => {
			const detailedRecipes = [
				{
					id: 1,
					image: 'image1.jpg',
					title: 'Recipe 1',
					readyInMinutes: 30,
					servings: 4,
					sourceUrl: 'http://recipe1.com',
					extraField: 'ignore'
				},
				{
					id: 2,
					image: 'image2.jpg',
					title: 'Recipe 2',
					readyInMinutes: 45,
					servings: 2,
					sourceUrl: 'http://recipe2.com',
					extraField: 'ignore'
				}
			];

			const expectedFiltered = [
				{
					id: 1,
					image: 'image1.jpg',
					title: 'Recipe 1',
					readyInMinutes: 30,
					servings: 4,
					sourceUrl: 'http://recipe1.com'
				},
				{
					id: 2,
					image: 'image2.jpg',
					title: 'Recipe 2',
					readyInMinutes: 45,
					servings: 2,
					sourceUrl: 'http://recipe2.com'
				}
			];

			beforeEach(() => {
				bulkResponse = createMockResponse(detailedRecipes, 200);
			});

			it('should filter detailed recipes and return a new JSON response with only specific fields', async () => {
				const response = await filterInformationBulkReponse(bulkResponse);
				expect(response.status).toBe(200);
				const json = await response.json();
				expect(json).toEqual(expectedFiltered);
			});
		});

		describe('when bulkResponse is an error', () => {
			const errorMessage = 'Bulk API error';

			beforeEach(() => {
				bulkResponse = new Response(errorMessage, {
					status: 500,
					headers: { 'Content-Type': 'text/plain' }
				});
			});

			it('should return the original error response if bulkResponse is not ok', async () => {
				const response = await filterInformationBulkReponse(bulkResponse);
				expect(response.status).toBe(500);
				const text = await response.text();
				expect(text).toBe(errorMessage);
			});
		});
	});
});
