import { describe, it, vi, afterEach } from 'vitest';
import { GET } from './+server.js';

import {
	mockRequestEvent,
	assertResponse,
	createMockResponse
} from './test-utils/mockUtils.ts';

describe('GET handler integration tests', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should return 400 if ingredients are missing', async () => {
		const response = await GET(mockRequestEvent('http://localhost/api/getRecipe'));

		assertResponse(response, 400, { error: 'Missing required parameter: ingredients' });
	});

	it('should return 500 if external API call fails on ingredients search', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValueOnce(createMockResponse('External API error', 500));

		const response = await GET(
			mockRequestEvent('http://localhost/api/getRecipe?ingredients=tomato,cheese')
		);

		assertResponse(response, 500, {
			error: 'Failed to fetch recipes by ingredients from RapidAPI',
			message: '"External API error"',
			status: 500
		});
	});

	it('should return 404 if no valid recipe IDs are found', async () => {
		const mockRecipes = [{ title: 'Recipe Without ID' }, { title: 'Another Recipe' }];

		vi.spyOn(global, 'fetch').mockResolvedValueOnce(createMockResponse(mockRecipes, 200));

		const response = await GET(
			mockRequestEvent('http://localhost/api/getRecipe?ingredients=tomato,cheese')
		);

		await assertResponse(response, 404, {
			error: 'No recipes found for the provided ingredients'
		});
	});

	it('should return error response if fetching bulk recipe details fails', async () => {
		const mockIngredientsRecipes = [
			{ id: 1, title: 'Tomato Soup', image: 'tomato_soup.jpg' },
			{ id: 2, title: 'Tomato Salad', image: 'tomato_salad.jpg' }
		];
		const errorText = 'Bulk API error';

		vi.spyOn(global, 'fetch')
			.mockResolvedValueOnce(createMockResponse(mockIngredientsRecipes, 200))
			.mockResolvedValueOnce(
				new Response(errorText, {
					status: 500,
					headers: { 'Content-Type': 'text/plain' }
				})
			);

		const response = await GET(
			mockRequestEvent('http://localhost/api/getRecipe?ingredients=tomato,cheese')
		);

		await assertResponse(response, 500, {
			error: 'Failed to fetch detailed recipe information',
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

		vi.spyOn(global, 'fetch')
			.mockResolvedValueOnce(createMockResponse(mockIngredientsRecipes, 200))
			.mockResolvedValueOnce(createMockResponse(mockDetailedRecipes, 200));

		const response = await GET(
			mockRequestEvent('http://localhost/api/getRecipe?ingredients=tomato,cheese')
		);

		assertResponse(response, 200, [
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
