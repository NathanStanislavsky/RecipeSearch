import { describe, it, expect, vi, afterEach, beforeEach, type MockInstance } from 'vitest';
import {
	extractRecipeIds,
	constructBulkApiURL,
	fetchBulkRecipeInformation,
	filterInformationBulkReponse
} from './recipeByIDUtils.js';
import { TestHelper } from '../../test/testHelper.ts';
import { ApiError, ConfigError } from '../../errors/AppError.js';

describe('recipeByIDsUtils', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		TestHelper.mockRateLimiter(true); // Allow API requests by default
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

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
			['data with no valid IDs', [{ id: 0 }, { id: 0 }]]
		])('when %s', (_, sampleData) => {
			it('returns an error response', async () => {
				const result = extractRecipeIds(sampleData);
				await TestHelper.assertResponse(result.errorResponse as Response, 404, {
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
				await TestHelper.assertResponse(result as Response, 400, {
					error: 'Missing or empty required parameter: ids'
				});
			});
		});
	});

	describe('fetchBulkRecipeInformation', () => {
		const testUrl = new URL(
			'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/informationBulk?ids=123,456,789'
		);
		let mockFetch: MockInstance<(input: RequestInfo, init?: RequestInit) => Promise<Response>>;

		beforeEach(() => {
			mockFetch = vi.spyOn(global, 'fetch');
		});

		it('returns a successful response when API returns 200', async () => {
			const mockData = [{ id: 123, title: 'Recipe One' }];
			const mockResponse = TestHelper.createMockResponse(mockData, 200);
			mockFetch.mockResolvedValueOnce(mockResponse);

			const response = await fetchBulkRecipeInformation(testUrl);
			expect(response.ok).toBe(true);
			expect(response.status).toBe(200);

			const json = await response.json();
			expect(json).toEqual(mockData);
		});

		it('returns error response when bulk API call fails', async () => {
			const errorText = 'Bulk API error';
			const mockResponse = TestHelper.createMockResponse(errorText, 500);
			mockFetch.mockResolvedValueOnce(mockResponse);

			// Mock the RateLimiter before the test
			TestHelper.mockRateLimiter(true);

			try {
				await fetchBulkRecipeInformation(testUrl);
				// Should not reach here
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(ApiError);
				const apiError = error as ApiError;
				expect(apiError.name).toBe('ApiError');
				expect(apiError.status).toBe(500);
			}
		});

		it('handles rate limit exceeded', async () => {
			// Mock the RateLimiter to deny requests
			TestHelper.mockRateLimiter(false);

			try {
				await fetchBulkRecipeInformation(testUrl);
				// Should not reach here
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(ConfigError);
				const configError = error as ConfigError;
				expect(configError.name).toBe('ConfigError');
				expect(configError.message).toBe('Daily API request limit reached');
			}
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
				bulkResponse = TestHelper.createMockResponse(detailedRecipes, 200);
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
