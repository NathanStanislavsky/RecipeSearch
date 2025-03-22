import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
import { addFavorite } from '../../../queries/favorites/addFavorite.ts';
import { jsonResponse } from '../../../utils/responseUtil.ts';

vi.mock('../../../queries/favorites/addFavorite.ts', () => {
	return {
		addFavorite: vi.fn(),
	};
});
vi.mock('../../../utils/responseUtil.ts', () => {
	return {
		jsonResponse: vi.fn((data, options) => ({ data, options })),
	};
});

describe('addFavorites route tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	it('should add a favorite and return a JSON response', async () => {
		const fakeResult = { id: 1 };
		(addFavorite as any).mockResolvedValue(fakeResult);

		const fakeRequest = {
			json: async () => ({
				userId: 1,
				recipeData: {
					id: 123,
					image: 'image-url',
					title: 'Recipe Title',
					readyInMinutes: 30,
					servings: 4,
					sourceUrl: 'source-url'
				},
			}),
		};

		const response = await POST({ request: fakeRequest });

		expect(addFavorite).toHaveBeenCalledWith(1, {
			id: 123,
			image: 'image-url',
			title: 'Recipe Title',
			readyInMinutes: 30,
			servings: 4,
			sourceUrl: 'source-url'
		});

		expect(jsonResponse).toHaveBeenCalledWith(fakeResult);
		expect(response).toEqual({ data: fakeResult, options: undefined });
	});

	it('should handle errors and return a 500 JSON error response', async () => {
		(addFavorite as any).mockRejectedValue(new Error('test error'));

		const fakeRequest = {
			json: async () => ({
				userId: 1,
				recipeData: { id: 123 },
			}),
		};

		const response = await POST({ request: fakeRequest });

		expect(jsonResponse).toHaveBeenCalledWith({ message: 'Internal server error' }, 500);
		expect(response).toEqual({ data: { message: 'Internal server error' }, options: 500 });
	});
});