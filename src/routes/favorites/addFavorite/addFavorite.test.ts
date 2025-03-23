import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server.ts';

vi.mock('../../../queries/favorites/addFavorite.ts', () => ({
	addFavorite: vi.fn()
}));

import { addFavorite } from '../../../queries/favorites/addFavorite';
import { assertResponse } from '../../../../test-utils/mockUtils';

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
				recipeData: mockRecipe
			})
		};

		const response = await POST({ request: fakeRequest });

		// Verify that addFavorite was called correctly.
		expect(addFavorite).toHaveBeenCalledWith(1, mockRecipe);
		// Use assertResponse to check that response has status 200 and contains fakeResult.
		await assertResponse(response, 200, fakeResult);
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

		await assertResponse(response, 500, { message: 'Internal server error' });
	});

	it('should return a 400 error if the request body is invalid', async () => {
		const fakeRequest = {
			json: async () => ({})
		};

		const response = await POST({ request: fakeRequest });

		await assertResponse(response, 400, { message: 'Invalid request body' });
	});
});
