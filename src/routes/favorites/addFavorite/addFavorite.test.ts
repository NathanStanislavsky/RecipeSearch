import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server.ts';

vi.mock('../../../queries/favorites/addFavorite.ts', () => ({
	addFavorite: vi.fn()
}));
vi.mock('../../../utils/responseUtil.ts', () => ({
	jsonResponse: vi.fn((data, options) => ({ data, options }))
}));

import { addFavorite } from '../../../queries/favorites/addFavorite';
import { jsonResponse } from '../../../utils/responseUtil';

describe('addFavorites route test', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	const mockRecipe = {
		id: 123,
		image: 'image-url',
		title: 'Recipe Title',
		readyInMinutes: 30,
		servings: 4,
		sourceUrl: 'source-url'
	};

	it('should add a favorite and return a JSON response', async () => {
		const fakeResult = { id: 1 };
		(addFavorite as any).mockResolvedValue(fakeResult);
		const fakeRequest = {
			json: async () => ({
				userId: 1,
				recipeData: {
					mockRecipe
				}
			})
		};

		const response = await POST({ request: fakeRequest });

		expect(addFavorite).toHaveBeenCalledWith(1, {
			mockRecipe
		});
		expect(jsonResponse).toHaveBeenCalledWith(fakeResult);
		expect(response).toEqual({ data: fakeResult, options: undefined });
	});

	it('should handle errors and return a 500 JSON error response', async () => {
		(addFavorite as any).mockRejectedValue(new Error('test error'));
		const fakeRequest = {
			json: async () => ({
				userId: 1,
				recipeData: { id: 123 }
			})
		};

		const response = await POST({ request: fakeRequest });

		expect(jsonResponse).toHaveBeenCalledWith(
			{ message: 'Internal server error' },
			{ status: 500 }
		);
		expect(response).toEqual({
			data: { message: 'Internal server error' },
			options: { status: 500 }
		});
	});

	it('should return a 400 error if the request body is invalid', async () => {
		const fakeRequest = {
			json: async () => ({})
		};

		const response = await POST({ request: fakeRequest });

		expect(jsonResponse).toHaveBeenCalledWith({ message: 'Invalid request body' }, { status: 400 });
		expect(response).toEqual({
			data: { message: 'Invalid request body' },
			options: { status: 400 }
		});
	});
});
