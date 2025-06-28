import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server.ts';
import type { RequestEvent } from '@sveltejs/kit';

vi.mock('$lib/server/mongo/index.js', () => {
	const mockClient = {
		db: vi.fn().mockReturnValue({
			collection: vi.fn().mockReturnValue({
				aggregate: vi.fn().mockReturnValue({
					[Symbol.asyncIterator]: async function* () {
						yield {
							_id: '685771e25f14caf1c6804ebe',
							name: 'Chicken Fried Steak W/Cream Gravy',
							id: 123456,
							minutes: 40,
							contributor_id: 12345,
							submitted: '2023-01-01',
							tags: 'main-course,comfort-food',
							nutrition: '[500, 25, 30, 15, 10, 20, 5]',
							n_steps: 5,
							steps: 'Step 1: Prepare ingredients. Step 2: Cook steak.',
							description: 'This is a recipe for Chicken Fried Steak with delicious cream gravy.',
							ingredients: 'shortening, seasoned flour, eggs, milk, chicken',
							n_ingredients: 5,
							score: 0.95
						};
						yield {
							_id: '685771e25f14caf1c6804ebf',
							name: 'Classic Pasta Carbonara',
							id: 789012,
							minutes: 30,
							contributor_id: 54321,
							submitted: '2023-02-01',
							tags: 'pasta,italian,quick',
							nutrition: '[400, 20, 35, 18, 8, 15, 3]',
							n_steps: 4,
							steps: 'Step 1: Boil pasta. Step 2: Prepare sauce.',
							description: 'Classic Italian pasta dish with eggs, bacon, and cheese.',
							ingredients: 'pasta, eggs, bacon, cheese, black pepper',
							n_ingredients: 5,
							score: 0.85
						};
					}
				})
			})
		})
	};

	return {
		getMongoClient: vi.fn().mockReturnValue(mockClient)
	};
});

vi.mock('$utils/api/apiUtils.js', () => ({
	createJsonResponse: vi.fn((data, status) => new Response(JSON.stringify(data), { status }))
}));

vi.mock('$utils/errors/AppError.js', () => ({
	ApiError: class ApiError extends Error {
		constructor(
			message: string,
			public status: number
		) {
			super(message);
			this.name = 'ApiError';
		}
	},
	handleError: vi.fn((error) => ({
		error: error.name || 'Error',
		message: error.message,
		status: error.status || 500
	}))
}));

describe('Ingredient Search API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return transformed search results for valid query', async () => {
		const url = new URL('http://localhost:5173/search?ingredients=chicken');
		const request = new Request(url);

		const response = await GET({ url, request } as RequestEvent);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.results).toHaveLength(2);
		expect(data.query).toBe('chicken');
		expect(data.total).toBe(2);

		// Check the first recipe transformation
		const firstRecipe = data.results[0];
		expect(firstRecipe.id).toBe(123456);
		expect(firstRecipe.name).toBe('Chicken Fried Steak W/Cream Gravy');
		expect(firstRecipe.minutes).toBe(40);
		expect(firstRecipe.nutrition).toBe('[500, 25, 30, 15, 10, 20, 5]');
		expect(firstRecipe.steps).toBe('Step 1: Prepare ingredients. Step 2: Cook steak.');
		expect(firstRecipe.description).toBe('This is a recipe for Chicken Fried Steak with delicious cream gravy.');
		expect(firstRecipe.ingredients).toBe('shortening, seasoned flour, eggs, milk, chicken');
		expect(firstRecipe.score).toBe(0.95);

		// Check the second recipe transformation
		const secondRecipe = data.results[1];
		expect(secondRecipe.id).toBe(789012);
		expect(secondRecipe.name).toBe('Classic Pasta Carbonara');
		expect(secondRecipe.minutes).toBe(30);
		expect(secondRecipe.ingredients).toBe('pasta, eggs, bacon, cheese, black pepper');
		expect(secondRecipe.score).toBe(0.85);
	});

	it('should return 400 error when ingredients query is missing', async () => {
		const url = new URL('http://localhost:5173/search');
		const request = new Request(url);

		const response = await GET({ url, request } as RequestEvent);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe('ApiError');
		expect(data.message).toBe('Search query is required');
	});

	it('should handle recipes with minimal data', async () => {
		// Re-mock for this specific test case
		const { getMongoClient } = await vi.importMock('$lib/server/mongo/index.js');
		const mockClient = getMongoClient as ReturnType<typeof vi.fn>;
		
		mockClient.mockReturnValue({
			db: vi.fn().mockReturnValue({
				collection: vi.fn().mockReturnValue({
					aggregate: vi.fn().mockReturnValue({
						async *[Symbol.asyncIterator]() {
							yield {
								_id: '685771e25f14caf1c6804ec0',
								name: 'Simple Recipe',
								id: 999999,
								minutes: 15,
								contributor_id: 11111,
								submitted: '2023-03-01',
								tags: 'simple',
								nutrition: '[200, 10, 15, 8, 5, 12, 2]',
								n_steps: 2,
								steps: 'Step 1: Mix ingredients. Step 2: Cook.',
								description: 'A very simple recipe.',
								ingredients: 'ingredient1, ingredient2',
								n_ingredients: 2,
								score: 0.75
							};
						}
					})
				})
			})
		});

		const url = new URL('http://localhost:5173/search?ingredients=simple');
		const request = new Request(url);

		const response = await GET({ url, request } as RequestEvent);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.results).toHaveLength(1);
		expect(data.total).toBe(1);

		const recipe = data.results[0];
		expect(recipe.name).toBe('Simple Recipe');
		expect(recipe.id).toBe(999999);
		expect(recipe.minutes).toBe(15);
		expect(recipe.ingredients).toBe('ingredient1, ingredient2');
		expect(recipe.score).toBe(0.75);
	});
});
