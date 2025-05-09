import { describe, it, vi, afterEach, beforeEach } from 'vitest';
import { GET } from '../routes/search/+server.ts';
import { TestHelper } from '../utils/test/testHelper.ts';

// Creates a mock request event with ingredients
function createMockRequest(ingredients: string) {
	return TestHelper.createMockRequestEvent(
		`http://localhost/api/getRecipe?ingredients=${ingredients}`
	);
}

async function testGetResponse(ingredients: string, expectedStatus: number, expectedBody: object) {
	const response = await GET(createMockRequest(ingredients));
	await TestHelper.assertResponse(response, expectedStatus, expectedBody);
}

describe('Search server integration tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
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
			mock: () =>
				TestHelper.setupMockFetch(TestHelper.createMockResponse('External API error', 500)),
			expectedError: {
				error: 'ApiError',
				message: '"External API error"',
				code: 'API_ERROR',
				status: 500
			}
		},
		{
			mock: () =>
				vi
					.spyOn(global, 'fetch')
					.mockImplementationOnce(
						() =>
							new Promise((_, reject) =>
								setTimeout(() => reject(new Error('Request timeout')), 100)
							)
					),
			expectedError: {
				error: 'ApiError',
				message: 'Request timeout',
				code: 'API_ERROR',
				status: 500
			}
		}
	])('should handle various API error scenarios', async ({ mock, expectedError }) => {
		mock();
		await testGetResponse('tomato,cheese', 500, expectedError);
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
		const errorText = 'Bulk API error';

		TestHelper.setupMockFetchSequence([
			TestHelper.createMockResponse(mockIngredientsRecipes, 200),
			new Response(errorText, {
				status: 500,
				headers: { 'Content-Type': 'text/plain' }
			})
		]);

		const response = await GET(createMockRequest('tomato,cheese'));

		await TestHelper.assertResponse(response, 500, {
			error: 'ApiError',
			message: errorText,
			code: 'API_ERROR',
			status: 500
		});
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
});
