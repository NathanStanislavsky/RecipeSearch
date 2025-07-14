import { describe, it, expect, vi, beforeEach } from 'vitest';
import { actions } from './+page.server.ts';
import type { RequestEvent } from '@sveltejs/kit';
import type { TransformedRecipe } from '../../types/recipe.js';

vi.mock('$env/static/private', () => ({
	MONGODB_DATABASE: 'test-database',
	MONGODB_COLLECTION: 'test-collection',
	MONGODB_SEARCH_INDEX: 'test-index',
	MONGODB_REVIEWS_COLLECTION: 'test-reviews-collection'
}));

vi.mock('$lib/server/mongo/index.js', () => {
	const mockUpdateOne = vi.fn().mockResolvedValue({ upsertedCount: 1 });
	const mockAggregate = vi.fn().mockReturnValue({
		toArray: vi.fn().mockResolvedValue([
			{
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
			},
			{
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
			}
		])
	});

	const mockCollection = {
		aggregate: mockAggregate,
		updateOne: mockUpdateOne
	};

	const mockClient = {
		db: vi.fn().mockReturnValue({
			collection: vi.fn().mockReturnValue(mockCollection)
		})
	};

	const mockGetMongoClient = vi.fn().mockReturnValue(mockClient);

	// Store references so we can access them in tests
	(globalThis as any).__mockGetMongoClient = mockGetMongoClient;
	(globalThis as any).__mockUpdateOne = mockUpdateOne;
	(globalThis as any).__mockAggregate = mockAggregate;
	(globalThis as any).__mockClient = mockClient;

	return {
		getMongoClient: mockGetMongoClient
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

// Helper functions to access the mocked functions
const getMockGetMongoClient = () => (globalThis as any).__mockGetMongoClient;
const getMockUpdateOne = () => (globalThis as any).__mockUpdateOne;
const getMockAggregate = () => (globalThis as any).__mockAggregate;
const getMockClient = () => (globalThis as any).__mockClient;

describe('Ingredient Search API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		
		// Reset to default successful state
		const mockGetMongoClient = getMockGetMongoClient();
		const mockUpdateOne = getMockUpdateOne();
		const mockAggregate = getMockAggregate();
		const mockClient = getMockClient();
		
		mockGetMongoClient.mockReturnValue(mockClient);
		mockUpdateOne.mockResolvedValue({ upsertedCount: 1 });
		mockAggregate.mockReturnValue({
			toArray: vi.fn().mockResolvedValue([
				{
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
				},
				{
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
				}
			])
		});
	});

	it('should return transformed search results for valid query', async () => {
		const formData = new FormData();
		formData.append('ingredients', 'chicken');
		const request = new Request('http://localhost:5173/search', {
			method: 'POST',
			body: formData
		});

		const result = await actions.search({
			request,
			locals: { user: null }
		} as unknown as RequestEvent);

		expect(result).toBeDefined();
		expect(result).toHaveProperty('results');
		expect(result).toHaveProperty('total');
		expect(result).toHaveProperty('query');

		const data = result as { results: TransformedRecipe[]; total: number; query: string };
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
		expect(firstRecipe.description).toBe(
			'This is a recipe for Chicken Fried Steak with delicious cream gravy.'
		);
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
		const formData = new FormData();
		// Don't add ingredients to test missing data
		const request = new Request('http://localhost:5173/search', {
			method: 'POST',
			body: formData
		});

		const result = await actions.search({
			request,
			locals: { user: null }
		} as unknown as RequestEvent);

		expect(result).toBeDefined();
		expect(result).toHaveProperty('status');
		expect(result).toHaveProperty('data');

		const failResult = result as { status: number; data: { message: string } };
		expect(failResult.status).toBe(400);
		expect(failResult.data.message).toBe('Search query is required');
	});

	it('should handle recipes with minimal data', async () => {
		const formData = new FormData();
		formData.append('ingredients', 'simple');
		const request = new Request('http://localhost:5173/search', {
			method: 'POST',
			body: formData
		});

		const result = await actions.search({
			request,
			locals: { user: null }
		} as unknown as RequestEvent);

		expect(result).toBeDefined();
		expect(result).toHaveProperty('results');
		expect(result).toHaveProperty('total');
		expect(result).toHaveProperty('query');

		const data = result as { results: TransformedRecipe[]; total: number; query: string };
		expect(data.results).toHaveLength(2);
		expect(data.total).toBe(2);
		expect(data.query).toBe('simple');

		const recipe = data.results[0];
		expect(recipe.name).toBe('Chicken Fried Steak W/Cream Gravy');
		expect(recipe.id).toBe(123456);
		expect(recipe.minutes).toBe(40);
		expect(recipe.ingredients).toBe('shortening, seasoned flour, eggs, milk, chicken');
		expect(recipe.score).toBe(0.95);
	});

	it('should return 500 if mongo client is not available', async () => {
		const mockGetMongoClient = getMockGetMongoClient();
		mockGetMongoClient.mockReturnValue(null);

		const formData = new FormData();
		formData.append('ingredients', 'chicken');
		const request = new Request('http://localhost:5173/search', {
			method: 'POST',
			body: formData
		});

		const result = await actions.search({
			request,
			locals: { user: null }
		} as unknown as RequestEvent);

		const failResult = result as { status: number; data: { message: string } };
		expect(failResult.status).toBe(500);
		expect(failResult.data.message).toBe('MongoDB client not found');
	});
});

describe('addRating action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		
		// Reset to default successful state
		const mockGetMongoClient = getMockGetMongoClient();
		const mockUpdateOne = getMockUpdateOne();
		const mockClient = getMockClient();
		
		mockGetMongoClient.mockReturnValue(mockClient);
		mockUpdateOne.mockResolvedValue({ upsertedCount: 1 });
	});

	it('should successfully add a new rating', async () => {
		const formData = new FormData();
		formData.append('recipeId', '123456');
		formData.append('rating', '5');

		const request = new Request('http://localhost:5173/search', {
			method: 'POST',
			body: formData
		});

		const result = await actions.addRating({
			request,
			locals: { user: { id: 'user123' } }
		} as unknown as RequestEvent);

		expect(result).toEqual({
			message: 'Rating created',
			recipeId: '123456',
			rating: '5',
			upserted: true
		});
	});

	it('should successfully update an existing rating', async () => {
		// Mock updateOne to return upsertedCount: 0 for an update
		const mockUpdateOne = getMockUpdateOne();
		mockUpdateOne.mockResolvedValue({ upsertedCount: 0 });

		const formData = new FormData();
		formData.append('recipeId', '123456');
		formData.append('rating', '4');

		const request = new Request('http://localhost:5173/search', {
			method: 'POST',
			body: formData
		});

		const result = await actions.addRating({
			request,
			locals: { user: { id: 'user123' } }
		} as unknown as RequestEvent);

		expect(result).toEqual({
			message: 'Rating updated',
			recipeId: '123456',
			rating: '4',
			upserted: false
		});
	});

	it('should return 400 if recipeId is missing', async () => {
		const formData = new FormData();
		formData.append('rating', '5');

		const request = new Request('http://localhost:5173/search', {
			method: 'POST',
			body: formData
		});

		const result = await actions.addRating({
			request,
			locals: { user: { id: 'user123' } }
		} as unknown as RequestEvent);

		const failResult = result as { status: number; data: { message: string } };
		expect(failResult.status).toBe(400);
		expect(failResult.data.message).toBe('Recipe ID and rating are required');
	});

	it('should return 400 if rating is missing', async () => {
		const formData = new FormData();
		formData.append('recipeId', '123456');

		const request = new Request('http://localhost:5173/search', {
			method: 'POST',
			body: formData
		});

		const result = await actions.addRating({
			request,
			locals: { user: { id: 'user123' } }
		} as unknown as RequestEvent);

		const failResult = result as { status: number; data: { message: string } };
		expect(failResult.status).toBe(400);
		expect(failResult.data.message).toBe('Recipe ID and rating are required');
	});

	it('should return 500 if mongo client is not available', async () => {
		const mockGetMongoClient = getMockGetMongoClient();
		mockGetMongoClient.mockReturnValue(null);

		const formData = new FormData();
		formData.append('recipeId', '123456');
		formData.append('rating', '5');

		const request = new Request('http://localhost:5173/search', {
			method: 'POST',
			body: formData
		});

		const result = await actions.addRating({
			request,
			locals: { user: { id: 'user123' } }
		} as unknown as RequestEvent);

		const failResult = result as { status: number; data: { message: string } };
		expect(failResult.status).toBe(500);
		expect(failResult.data.message).toBe('Failed to connect to MongoDB');
	});

	it('should handle errors during rating submission', async () => {
		const mockUpdateOne = getMockUpdateOne();
		mockUpdateOne.mockRejectedValue(new Error('Update failed'));

		const formData = new FormData();
		formData.append('recipeId', '123456');
		formData.append('rating', '5');

		const request = new Request('http://localhost:5173/search', {
			method: 'POST',
			body: formData
		});

		const result = await actions.addRating({
			request,
			locals: { user: { id: 'user123' } }
		} as unknown as RequestEvent);

		const failResult = result as { status: number; data: { message: string } };
		expect(failResult.status).toBe(500);
		expect(failResult.data.message).toBe('Update failed');
	});
});
