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
							name: 'Chicken Pasta',
							ingredients: ['chicken', 'pasta', 'tomato'],
							description: 'A delicious chicken pasta dish',
							score: 0.95
						};
						yield {
							name: 'Pasta Carbonara',
							ingredients: ['pasta', 'eggs', 'bacon'],
							description: 'Classic Italian pasta dish',
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

	it('should return search results for valid query', async () => {
		const url = new URL('http://localhost:5173/ingredientSearch?ingredients=chicken');
		const request = new Request(url);

		const response = await GET({ url, request } as RequestEvent);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.results).toHaveLength(2);
		expect(data.query).toBe('chicken');
		expect(data.results[0].name).toBe('Chicken Pasta');
	});

	it('should return 400 error when ingredients query is missing', async () => {
		const url = new URL('http://localhost:5173/ingredientSearch');
		const request = new Request(url);

		const response = await GET({ url, request } as RequestEvent);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toBe('ApiError');
		expect(data.message).toBe('Search query is required');
	});
});
