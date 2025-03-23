import { describe, it, beforeEach, expect, vi } from 'vitest';
import { DELETE } from './+server.ts';
import { removeFavorite } from '../../../queries/favorites/deleteFavorite';
import { assertResponse } from '../../../../test-utils/mockUtils';

vi.mock('../../../queries/favorites/deleteFavorite', () => ({
	removeFavorite: vi.fn()
}));

describe('deleteFavorites route test', () => {
	beforeEach(() => {
		vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
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
		await assertResponse(response, 200, fakeResult);
	});

	it('should return a 400 error if the request body is invalid', async () => {
		const fakeRequest = {
			json: async () => ({})
		};

		const response = await DELETE({ request: fakeRequest });

		await assertResponse(response, 400, { message: 'Invalid request body' });
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

		await assertResponse(response, 500, { message: 'Internal server error' });
	});
});