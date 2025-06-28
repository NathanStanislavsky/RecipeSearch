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
							Name: 'Chicken Fried Steak W/Cream Gravy',
							Images:
								'c("https://img.sndimg.com/food/image/upload/w_555,h_416,c_fit,fl_progressive,q_95/v1/img/recipes/12/31/6/picMcBTAX.jpg")',
							CookTime: 'PT30M',
							PrepTime: 'PT10M',
							RecipeServings: '4',
							Description: 'This is a recipe for Chicken Fried Steak...',
							RecipeIngredientParts: 'c("shortening", "seasoned flour", "eggs", "milk")',
							AggregatedRating: 5,
							score: 0.95
						};
						yield {
							_id: '685771e25f14caf1c6804ebf',
							Name: 'Classic Pasta Carbonara',
							Images: 'c("https://example.com/pasta.jpg")',
							CookTime: 'PT25M',
							PrepTime: 'PT5M',
							RecipeServings: '2',
							Description: 'Classic Italian pasta dish',
							RecipeIngredientParts: 'c("pasta", "eggs", "bacon", "cheese")',
							AggregatedRating: 4.5,
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

		// Check the first recipe transformation
		const firstRecipe = data.results[0];
		expect(firstRecipe.id).toBe('685771e25f14caf1c6804ebe');
		expect(firstRecipe.title).toBe('Chicken Fried Steak W/Cream Gravy');
		expect(firstRecipe.image).toBe(
			'https://img.sndimg.com/food/image/upload/w_555,h_416,c_fit,fl_progressive,q_95/v1/img/recipes/12/31/6/picMcBTAX.jpg'
		);
		expect(firstRecipe.readyInMinutes).toBe(40); // 30 + 10 minutes
		expect(firstRecipe.servings).toBe(4);
		expect(firstRecipe.sourceUrl).toBe('#recipe-685771e25f14caf1c6804ebe');

		// Check the second recipe transformation
		const secondRecipe = data.results[1];
		expect(secondRecipe.id).toBe('685771e25f14caf1c6804ebf');
		expect(secondRecipe.title).toBe('Classic Pasta Carbonara');
		expect(secondRecipe.readyInMinutes).toBe(30); // 25 + 5 minutes
		expect(secondRecipe.servings).toBe(2);
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

	it('should handle recipes with missing optional fields', async () => {
		// Re-mock for this specific test case
		const { getMongoClient } = (await vi.importMock('$lib/server/mongo/index.js')) as any;
		getMongoClient.mockReturnValue({
			db: vi.fn().mockReturnValue({
				collection: vi.fn().mockReturnValue({
					aggregate: vi.fn().mockReturnValue({
						[Symbol.asyncIterator]: async function* () {
							yield {
								_id: '685771e25f14caf1c6804ec0',
								Name: 'Simple Recipe',
								// Missing Images, CookTime, PrepTime, RecipeServings
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

		const recipe = data.results[0];
		expect(recipe.title).toBe('Simple Recipe');
		expect(recipe.image).toBe('/favicon.png'); // fallback
		expect(recipe.readyInMinutes).toBe(30); // fallback
		expect(recipe.servings).toBe(1); // fallback
	});
});
