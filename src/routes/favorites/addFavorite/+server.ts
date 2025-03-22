import type { RequestHandler } from '@sveltejs/kit';
import { addFavorite } from '../../../queries/favorites/addFavorite.ts';
import { jsonResponse } from '../../../utils/responseUtil.ts';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { userId, recipeData } = await request.json();
		const result = await addFavorite(userId, recipeData);
		return jsonResponse(result);
	} catch (error) {
		console.error('Error adding favorite:', error);
		return jsonResponse({ message: 'Internal server error' }, 500);
	}
}
