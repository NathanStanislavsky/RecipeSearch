import { describe, it, vi, afterEach, beforeEach, expect } from 'vitest';
import { GET } from '../routes/search/+server.ts';
import { TestHelper } from '../utils/test/testHelper.ts';
import { db } from '$lib/server/db/index.js';
import { ingredientSearches, recipes } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

function createMockRequest(ingredients: string) {
	return TestHelper.createMockRequestEvent(
		`http://localhost/api/getRecipe?ingredients=${ingredients}`
	);
}

async function testGetResponse(
	ingredients: string,
	expectedStatus: number,
	expectedBody: Record<string, string | number | boolean>
) {
	const response = await GET(createMockRequest(ingredients));
	const data = await response.json();
	expect(response.status).toBe(expectedStatus);
	if (expectedBody) {
		Object.keys(expectedBody).forEach((key) => {
			expect(data[key]).toBe(expectedBody[key]);
		});
	}
}

describe('Search server integration tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, 'error').mockImplementation(() => {});
		TestHelper.mockRateLimiter(true);
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		await db.delete(ingredientSearches);
		await db.delete(recipes);
	});

	it.each([
		{
			url: 'http://localhost/api/getRecipe',
			expectedError: {
				error: 'ValidationError',
				message: 'Missing required parameter: ingredients',
				code: 'VALIDATION_ERROR',
				status: 400
			}
		},
		{
			url: 'http://localhost/api/getRecipe?ingredients=',
			expectedError: {
				error: 'ValidationError',
				message: 'Missing required parameter: ingredients',
				code: 'VALIDATION_ERROR',
				status: 400
			}
		}
	])(
		'should return 400 for invalid ingredient parameters when URL is "%s"',
		async ({ url, expectedError }) => {
			const response = await GET(TestHelper.createMockRequestEvent(url));
			await TestHelper.assertResponse(response, 400, expectedError);
		}
	);

	it.each([
		{
			mock: () => {
				TestHelper.setupMockFetch(TestHelper.createMockResponse('External API error', 500));
			},
			expectedError: {
				error: 'ApiError'
			}
		},
		{
			mock: () => {
				vi.spyOn(global, 'fetch').mockImplementationOnce(
					() =>
						new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 100))
				);
			},
			expectedError: {
				error: 'AppError'
			}
		}
	])('should handle various API error scenarios', async ({ mock, expectedError }) => {
		mock();
		const response = await GET(createMockRequest('tomato,cheese'));
		expect(response.status).toBe(500);
		const data = await response.json();
		expect(data.error).toBe(expectedError.error);
	});

	it.each([
		{
			mock: () =>
				TestHelper.setupMockFetch(
					TestHelper.createMockResponse(
						[{ title: 'Recipe Without ID' }, { title: 'Another Recipe' }],
						200
					)
				),
			expectedError: { error: 'No recipes found for the provided ingredients' },
			expectedStatus: 404
		},
		{
			mock: () => TestHelper.setupMockFetch(TestHelper.createMockResponse([], 200)),
			expectedError: { error: 'No recipes found for the provided ingredients' },
			expectedStatus: 404
		}
	])('should handle no results scenarios', async ({ mock, expectedError, expectedStatus }) => {
		mock();
		await testGetResponse('tomato,cheese', expectedStatus, expectedError);
	});

	it('should return error response if fetching bulk recipe details fails', async () => {
		const mockIngredientsRecipes = [
			{ id: 1, title: 'Tomato Soup', image: 'tomato_soup.jpg' },
			{ id: 2, title: 'Tomato Salad', image: 'tomato_salad.jpg' }
		];

		TestHelper.setupMockFetchSequence([
			TestHelper.createMockResponse(mockIngredientsRecipes, 200),
			new Response('Bulk API error', {
				status: 500,
				headers: { 'Content-Type': 'text/plain' }
			})
		]);

		const response = await GET(createMockRequest('tomato,cheese'));
		expect(response.status).toBe(500);
		const data = await response.json();
		expect(data.error).toBe('ApiError');
	});

	it('should return 200 with filtered recipes if API calls succeed', async () => {
		const mockIngredientsRecipes = [
			{ id: 1, title: 'Tomato Soup', image: 'tomato_soup.jpg' },
			{ id: 2, title: 'Tomato Salad', image: 'tomato_salad.jpg' }
		];

		const mockDetailedRecipes = [
			{
				id: 1,
				image: 'tomato_soup.jpg',
				title: 'Tomato Soup',
				readyInMinutes: 30,
				servings: 4,
				sourceUrl: 'http://recipe1.com',
				extraField: 'ignore'
			},
			{
				id: 2,
				image: 'tomato_salad.jpg',
				title: 'Tomato Salad',
				readyInMinutes: 20,
				servings: 2,
				sourceUrl: 'http://recipe2.com',
				extraField: 'ignore'
			}
		];

		TestHelper.setupMockFetchSequence([
			TestHelper.createMockResponse(mockIngredientsRecipes, 200),
			TestHelper.createMockResponse(mockDetailedRecipes, 200)
		]);

		const response = await GET(createMockRequest('tomato,cheese'));

		await TestHelper.assertResponse(response, 200, [
			{
				id: 1,
				image: 'tomato_soup.jpg',
				title: 'Tomato Soup',
				readyInMinutes: 30,
				servings: 4,
				sourceUrl: 'http://recipe1.com'
			},
			{
				id: 2,
				image: 'tomato_salad.jpg',
				title: 'Tomato Salad',
				readyInMinutes: 20,
				servings: 2,
				sourceUrl: 'http://recipe2.com'
			}
		]);
	});

	it('should handle rate limit exceeded', async () => {
		TestHelper.mockRateLimiter(false);

		const response = await GET(createMockRequest('tomato,cheese'));
		expect(response.status).toBe(500);
		const data = await response.json();
		expect(data.error).toBe('ConfigError');
		expect(data.message).toBe('Daily API request limit reached');
	});

	describe('Recipe caching', () => {
		it('should cache and retrieve recipes for the same ingredients in different order', async () => {
			const mockIngredientsRecipes = [
				{ id: 1, title: 'Tomato Soup', image: 'tomato_soup.jpg' },
				{ id: 2, title: 'Tomato Salad', image: 'tomato_salad.jpg' }
			];

			const mockDetailedRecipes = [
				{
					id: 1,
					image: 'tomato_soup.jpg',
					title: 'Tomato Soup',
					readyInMinutes: 30,
					servings: 4,
					sourceUrl: 'http://recipe1.com'
				},
				{
					id: 2,
					image: 'tomato_salad.jpg',
					title: 'Tomato Salad',
					readyInMinutes: 20,
					servings: 2,
					sourceUrl: 'http://recipe2.com'
				}
			];

			TestHelper.setupMockFetchSequence([
				TestHelper.createMockResponse(mockIngredientsRecipes, 200),
				TestHelper.createMockResponse(mockDetailedRecipes, 200)
			]);

			const firstResponse = await GET(createMockRequest('tomato,cheese'));
			expect(firstResponse.status).toBe(200);
			const firstData = await firstResponse.json();
			expect(firstData).toHaveLength(2);

			const secondResponse = await GET(createMockRequest('cheese,tomato'));
			expect(secondResponse.status).toBe(200);
			const secondData = await secondResponse.json();
			expect(secondData).toHaveLength(2);
			expect(secondData).toEqual(firstData);

			expect(global.fetch).toHaveBeenCalledTimes(2);
		});

		it('should cache and retrieve recipes with different ingredient cases', async () => {
			const mockIngredientsRecipes = [{ id: 1, title: 'Tomato Soup', image: 'tomato_soup.jpg' }];

			const mockDetailedRecipes = [
				{
					id: 1,
					image: 'tomato_soup.jpg',
					title: 'Tomato Soup',
					readyInMinutes: 30,
					servings: 4,
					sourceUrl: 'http://recipe1.com'
				}
			];

			TestHelper.setupMockFetchSequence([
				TestHelper.createMockResponse(mockIngredientsRecipes, 200),
				TestHelper.createMockResponse(mockDetailedRecipes, 200)
			]);

			const firstResponse = await GET(createMockRequest('Tomato,Cheese'));
			expect(firstResponse.status).toBe(200);

			const secondResponse = await GET(createMockRequest('tomato,cheese'));
			expect(secondResponse.status).toBe(200);
			const secondData = await secondResponse.json();
			expect(secondData).toHaveLength(1);

			expect(global.fetch).toHaveBeenCalledTimes(2);
		});

		it('should handle partial cache hits', async () => {
			await db.insert(recipes).values({
				id: 1,
				image: 'cached_soup.jpg',
				title: 'Cached Soup',
				readyInMinutes: 30,
				servings: 4,
				sourceUrl: 'http://cached.com'
			});

			await db.insert(ingredientSearches).values({
				ingredients: 'tomato,cheese',
				recipeIds: '1,2'
			});

			const mockIngredientsRecipes = [
				{ id: 1, title: 'Cached Soup', image: 'cached_soup.jpg' },
				{ id: 2, title: 'New Salad', image: 'new_salad.jpg' }
			];

			const mockDetailedRecipes = [
				{
					id: 2,
					image: 'new_salad.jpg',
					title: 'New Salad',
					readyInMinutes: 20,
					servings: 2,
					sourceUrl: 'http://new.com'
				}
			];

			TestHelper.setupMockFetchSequence([
				TestHelper.createMockResponse(mockIngredientsRecipes, 200),
				TestHelper.createMockResponse(mockDetailedRecipes, 200)
			]);

			const response = await GET(createMockRequest('tomato,cheese'));
			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data).toHaveLength(2);
			expect(data[0].title).toBe('Cached Soup');
			expect(data[1].title).toBe('New Salad');
		});

		it('should handle empty cache and no results', async () => {
			TestHelper.setupMockFetchSequence([
				TestHelper.createMockResponse([], 200),
				TestHelper.createMockResponse([], 200)
			]);

			const response = await GET(createMockRequest('nonexistent,ingredients'));
			expect(response.status).toBe(404);
			const data = await response.json();
			expect(data.error).toBe('No recipes found for the provided ingredients');

			const cachedSearch = await db
				.select()
				.from(ingredientSearches)
				.where(eq(ingredientSearches.ingredients, 'nonexistent,ingredients'));
			expect(cachedSearch.length).toBe(0);
		});
	});
});
