import type { RequestHandler } from '@sveltejs/kit';
import { removeFavorite } from '../../../queries/favorites/deleteFavorite.ts';
import { jsonResponse } from '../../../utils/responseUtil.ts';

export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const { userId, recipeId } = await request.json();
		if (!userId || !recipeId) {
			return jsonResponse({ message: 'Invalid request body' }, 400 );
		}

		const result = await removeFavorite(userId, recipeId);

		return jsonResponse(result);
	} catch (error) {
		console.error('Error adding favorite:', error);
		return jsonResponse({ message: 'Internal server error' }, 500);
	}
}
