import { describe, it, beforeEach, expect, vi } from 'vitest';
import { GET } from './+server.ts';
import { getUserFavorites } from '../../../queries/favorites/getUserFavorites.ts';
import { assertResponse } from '../../../../test-utils/mockUtils';

vi.mock('../../../queries/favorites/getUserFavorites', () => ({
	getUserFavorites: vi.fn()
}));

describe('deleteFavorites route test', () => {
	beforeEach(() => {
		vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	it('should delete a favorite and return a JSON response', async () => {
		const fakeResult = { success: true };
		(getUserFavorites as any).mockResolvedValue(fakeResult);
		const fakeRequest = {
			json: async () => ({
				userId: 1,
			})
		};

		const response = await GET({ request: fakeRequest });

		expect(getUserFavorites).toHaveBeenCalledWith(1);
		await assertResponse(response, 200, fakeResult);
	});

	it('should return a 400 error if the request body is invalid', async () => {
		const fakeRequest = {
			json: async () => ({})
		};

		const response = await GET({ request: fakeRequest });

		await assertResponse(response, 400, { message: 'Invalid request body' });
	});

	it('should handle errors and return a 500 JSON error response', async () => {
		(getUserFavorites as any).mockRejectedValue(new Error('Test error'));
		const fakeRequest = {
			json: async () => ({
				userId: 1,
			})
		};

		const response = await GET({ request: fakeRequest });

		await assertResponse(response, 500, { message: 'Internal server error' });
	});
});