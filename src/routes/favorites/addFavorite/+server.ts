import type { RequestHandler } from '@sveltejs/kit';
import { addFavorite } from '../../../queries/favorites/addFavorite';
import { jsonResponse } from '../../../utils/responseUtil';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { userId, recipeData } = await request.json();
		if (!userId || !recipeData) {
			return jsonResponse({ message: 'Invalid request body' }, 400);
		}

		const result = await addFavorite(userId, recipeData);

		return jsonResponse(result);
	} catch (error) {
		console.error('Error adding favorite:', error);
		return jsonResponse({ message: 'Internal server error' }, 500);
	}
}
