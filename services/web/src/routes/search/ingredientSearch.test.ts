import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { actions } from './+page.server.ts';
import type { RequestEvent } from '@sveltejs/kit';
import type { TransformedRecipe } from '../../data/models/Recipe.js';

vi.mock('../../data/services/RecipeService.js', () => {
	const mockSearchRecipesWithUserRatings = vi.fn();
	const mockRateRecipe = vi.fn();

	return {
		RecipeService: vi.fn().mockImplementation(() => ({
			searchRecipesWithUserRatings: mockSearchRecipesWithUserRatings,
			rateRecipe: mockRateRecipe
		})),
		__mockSearchRecipesWithUserRatings: mockSearchRecipesWithUserRatings,
		__mockRateRecipe: mockRateRecipe
	};
});

let mockSearchRecipesWithUserRatings: ReturnType<typeof vi.fn>;
let mockRateRecipe: ReturnType<typeof vi.fn>;

beforeAll(async () => {
	const module = await import('../../data/services/RecipeService.js');
	mockSearchRecipesWithUserRatings = (
		module as typeof module & {
			__mockSearchRecipesWithUserRatings: ReturnType<typeof vi.fn>;
			__mockRateRecipe: ReturnType<typeof vi.fn>;
		}
	).__mockSearchRecipesWithUserRatings;
	mockRateRecipe = (
		module as typeof module & {
			__mockSearchRecipesWithUserRatings: ReturnType<typeof vi.fn>;
			__mockRateRecipe: ReturnType<typeof vi.fn>;
		}
	).__mockRateRecipe;
});

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
		const mockRecipes: TransformedRecipe[] = [
			{
				id: 123456,
				name: 'Chicken Fried Steak W/Cream Gravy',
				minutes: 40,
				nutrition: '[500, 25, 30, 15, 10, 20, 5]',
				steps: 'Step 1: Prepare ingredients. Step 2: Cook steak.',
				description: 'This is a recipe for Chicken Fried Steak with delicious cream gravy.',
				ingredients: 'shortening, seasoned flour, eggs, milk, chicken'
			},
			{
				id: 789012,
				name: 'Classic Pasta Carbonara',
				minutes: 30,
				nutrition: '[400, 20, 35, 18, 8, 15, 3]',
				steps: 'Step 1: Boil pasta. Step 2: Prepare sauce.',
				description: 'Classic Italian pasta dish with eggs, bacon, and cheese.',
				ingredients: 'pasta, eggs, bacon, cheese, black pepper'
			}
		];

		mockSearchRecipesWithUserRatings.mockResolvedValue({
			recipes: mockRecipes,
			total: 2,
			query: 'chicken',
			hasMore: false
		});

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

		const secondRecipe = data.results[1];
		expect(secondRecipe.id).toBe(789012);
		expect(secondRecipe.name).toBe('Classic Pasta Carbonara');
		expect(secondRecipe.minutes).toBe(30);
		expect(secondRecipe.ingredients).toBe('pasta, eggs, bacon, cheese, black pepper');

		expect(mockSearchRecipesWithUserRatings).toHaveBeenCalledWith('chicken', undefined, {
			limit: 50
		});
	});

	it('should return 400 error when ingredients query is missing', async () => {
		const formData = new FormData();
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
		const mockRecipes: TransformedRecipe[] = [
			{
				id: 123456,
				name: 'Chicken Fried Steak W/Cream Gravy',
				minutes: 40,
				nutrition: '[500, 25, 30, 15, 10, 20, 5]',
				steps: 'Step 1: Prepare ingredients. Step 2: Cook steak.',
				description: 'This is a recipe for Chicken Fried Steak with delicious cream gravy.',
				ingredients: 'shortening, seasoned flour, eggs, milk, chicken'
			}
		];

		mockSearchRecipesWithUserRatings.mockResolvedValue({
			recipes: mockRecipes,
			total: 1,
			query: 'simple',
			hasMore: false
		});

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
		expect(data.results).toHaveLength(1);
		expect(data.total).toBe(1);
		expect(data.query).toBe('simple');

		const recipe = data.results[0];
		expect(recipe.name).toBe('Chicken Fried Steak W/Cream Gravy');
		expect(recipe.id).toBe(123456);
		expect(recipe.minutes).toBe(40);
		expect(recipe.ingredients).toBe('shortening, seasoned flour, eggs, milk, chicken');
	});

	it('should handle service errors gracefully', async () => {
		mockSearchRecipesWithUserRatings.mockRejectedValue(new Error('Database connection failed'));

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
		expect(failResult.data.message).toBe('Database connection failed');
	});
});

describe('addRating action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should successfully add a new rating', async () => {
		mockRateRecipe.mockResolvedValue({
			upserted: true,
			rating: 5
		});

		const formData = new FormData();
		formData.append('recipe_id', '123456');
		formData.append('rating', '5');

		const request = new Request('http://localhost:5173/search', {
			method: 'POST',
			body: formData
		});

		const result = await actions.addRating({
			request,
			locals: { user: { id: 123 } }
		} as unknown as RequestEvent);

		expect(result).toEqual({
			message: 'Rating created',
			recipe_id: '123456',
			rating: 5,
			upserted: true
		});

		expect(mockRateRecipe).toHaveBeenCalledWith(123, 123456, 5);
	});

	it('should successfully update an existing rating', async () => {
		mockRateRecipe.mockResolvedValue({
			upserted: false,
			rating: 4
		});

		const formData = new FormData();
		formData.append('recipe_id', '123456');
		formData.append('rating', '4');

		const request = new Request('http://localhost:5173/search', {
			method: 'POST',
			body: formData
		});

		const result = await actions.addRating({
			request,
			locals: { user: { id: 123 } }
		} as unknown as RequestEvent);

		expect(result).toEqual({
			message: 'Rating updated',
			recipe_id: '123456',
			rating: 4,
			upserted: false
		});
	});

	it('should return 400 if recipe_id is missing', async () => {
		const formData = new FormData();
		formData.append('rating', '5');

		const request = new Request('http://localhost:5173/search', {
			method: 'POST',
			body: formData
		});

		const result = await actions.addRating({
			request,
			locals: { user: { id: 123 } }
		} as unknown as RequestEvent);

		const failResult = result as { status: number; data: { message: string } };
		expect(failResult.status).toBe(400);
		expect(failResult.data.message).toBe('Recipe ID and rating are required');
	});

	it('should return 400 if rating is missing', async () => {
		const formData = new FormData();
		formData.append('recipe_id', '123456');

		const request = new Request('http://localhost:5173/search', {
			method: 'POST',
			body: formData
		});

		const result = await actions.addRating({
			request,
			locals: { user: { id: 123 } }
		} as unknown as RequestEvent);

		const failResult = result as { status: number; data: { message: string } };
		expect(failResult.status).toBe(400);
		expect(failResult.data.message).toBe('Recipe ID and rating are required');
	});

	it('should return 401 if user is not authenticated', async () => {
		const formData = new FormData();
		formData.append('recipe_id', '123456');
		formData.append('rating', '5');

		const request = new Request('http://localhost:5173/search', {
			method: 'POST',
			body: formData
		});

		const result = await actions.addRating({
			request,
			locals: { user: null }
		} as unknown as RequestEvent);

		const failResult = result as { status: number; data: { message: string } };
		expect(failResult.status).toBe(401);
		expect(failResult.data.message).toBe('User not authenticated');
	});

	it('should handle service errors during rating submission', async () => {
		mockRateRecipe.mockRejectedValue(new Error('Update failed'));

		const formData = new FormData();
		formData.append('recipe_id', '123456');
		formData.append('rating', '5');

		const request = new Request('http://localhost:5173/search', {
			method: 'POST',
			body: formData
		});

		const result = await actions.addRating({
			request,
			locals: { user: { id: 123 } }
		} as unknown as RequestEvent);

		const failResult = result as { status: number; data: { message: string } };
		expect(failResult.status).toBe(500);
		expect(failResult.data.message).toBe('Update failed');
	});
});
