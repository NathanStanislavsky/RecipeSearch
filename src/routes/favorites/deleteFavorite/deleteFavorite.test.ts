import { describe, it, beforeEach, expect, vi } from 'vitest';
import { DELETE } from './+server.ts';
import { removeFavorite } from '../../../queries/favorites/deleteFavorite';
import { jsonResponse } from '../../../utils/responseUtil';

vi.mock('../../../queries/favorites/deleteFavorite', () => ({
	removeFavorite: vi.fn()
}));
vi.mock('../../../utils/responseUtil', () => ({
	jsonResponse: vi.fn((data, options) => ({ data, options }))
}));

describe('deleteFavorites route test', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should delete a favorite and return a JSON response', async () => {
		const fakeResult = { success: true };
		(removeFavorite as any).mockResolvedValue(fakeResult);
		const fakeRequest = {
			json: async () => ({
				userId: 1,
				recipeId: 123
			})
		};

		const response = await DELETE({ request: fakeRequest });

		expect(removeFavorite).toHaveBeenCalledWith(1, 123);
		expect(jsonResponse).toHaveBeenCalledWith(fakeResult);
		expect(response).toEqual({ data: fakeResult, options: undefined });
	});

	it('should return a 400 error if the request body is invalid', async () => {
		const fakeRequest = {
			json: async () => ({})
		};

		const response = await DELETE({ request: fakeRequest });

		expect(jsonResponse).toHaveBeenCalledWith({ message: 'Invalid request body' }, 400);
		expect(response).toEqual({
			data: { message: 'Invalid request body' },
			options: 400
		});
	});

	it('should handle errors and return a 500 JSON error response', async () => {
		(removeFavorite as any).mockRejectedValue(new Error('Test error'));
		const fakeRequest = {
			json: async () => ({
				userId: 1,
				recipeId: 123
			})
		};

		const response = await DELETE({ request: fakeRequest });

		expect(jsonResponse).toHaveBeenCalledWith({ message: 'Internal server error' }, 500);
		expect(response).toEqual({
			data: { message: 'Internal server error' },
			options: 500
		});
	});
});
