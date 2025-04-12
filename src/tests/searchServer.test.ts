import { describe, it, vi, afterEach, beforeEach } from 'vitest';
import { GET } from '../routes/search/+server.ts';
import { mockRequestEvent, assertResponse, createMockResponse } from '../utils/test/mockUtils.ts';

// Helper: Creates a mock request event with ingredients
function createMockRequest(ingredients: string) {
	return mockRequestEvent(`http://localhost/api/getRecipe?ingredients=${ingredients}`);
}

// Helper: Sets up mock fetch with a single response
function setupMockFetch(response: Response) {
	vi.spyOn(global, 'fetch').mockResolvedValueOnce(response);
}

// Helper: Sets up mock fetch with multiple responses
function setupMockFetchSequence(responses: Response[]) {
	const spy = vi.spyOn(global, 'fetch');
	responses.forEach((response) => spy.mockResolvedValueOnce(response));
}

describe('Search server integration tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should return 400 for invalid ingredient parameters', async () => {
		const scenarios = [
			{
				url: 'http://localhost/api/getRecipe',
				expectedError: 'Missing required parameter: ingredients'
			},
			{
				url: 'http://localhost/api/getRecipe?ingredients=',
				expectedError: 'Missing required parameter: ingredients'
			}
		];

		for (const scenario of scenarios) {
			const response = await GET(mockRequestEvent(scenario.url));
			await assertResponse(response, 400, { error: scenario.expectedError });
		}
	});

	it('should handle various API error scenarios', async () => {
		const errorScenarios = [
			{
				mock: () => setupMockFetch(createMockResponse('External API error', 500)),
				expectedError: {
					error: 'Failed to fetch data from RapidAPI',
					message: '"External API error"',
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
					error: 'Failed to fetch recipes',
					message: 'Request timeout'
				}
			}
		];

		for (const scenario of errorScenarios) {
			scenario.mock();
			const response = await GET(createMockRequest('tomato,cheese'));
			await assertResponse(response, 500, scenario.expectedError);
		}
	});

	it('should handle no results scenarios', async () => {
		const noResultsScenarios = [
			{
				mock: () =>
					setupMockFetch(
						createMockResponse([{ title: 'Recipe Without ID' }, { title: 'Another Recipe' }], 200)
					),
				expectedError: { error: 'No recipes found for the provided ingredients' }
			},
			{
				mock: () => setupMockFetch(createMockResponse([], 200)),
				expectedError: { error: 'No recipes found for the provided ingredients' }
			}
		];

		for (const scenario of noResultsScenarios) {
			scenario.mock();
			const response = await GET(createMockRequest('tomato,cheese'));
			await assertResponse(response, 404, scenario.expectedError);
		}
	});

	it('should return error response if fetching bulk recipe details fails', async () => {
		const mockIngredientsRecipes = [
			{ id: 1, title: 'Tomato Soup', image: 'tomato_soup.jpg' },
			{ id: 2, title: 'Tomato Salad', image: 'tomato_salad.jpg' }
		];
		const errorText = 'Bulk API error';

		setupMockFetchSequence([
			createMockResponse(mockIngredientsRecipes, 200),
			new Response(errorText, {
				status: 500,
				headers: { 'Content-Type': 'text/plain' }
			})
		]);

		const response = await GET(createMockRequest('tomato,cheese'));

		await assertResponse(response, 500, {
			error: 'Failed to fetch data from RapidAPI',
			status: 500,
			message: errorText
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

		setupMockFetchSequence([
			createMockResponse(mockIngredientsRecipes, 200),
			createMockResponse(mockDetailedRecipes, 200)
		]);

		const response = await GET(createMockRequest('tomato,cheese'));

		await assertResponse(response, 200, [
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
