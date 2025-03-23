import type { RequestHandler } from '@sveltejs/kit';
import { getUserFavorites } from '../../../queries/favorites/getUserFavorites.ts';
import { jsonResponse } from '../../../utils/responseUtil.ts';

export const GET: RequestHandler = async ({ request }) => {
    try {
        const { userId } = await request.json();

		if (!userId) {
			return jsonResponse({ message: 'Invalid request body' }, 400 );
		}

		const result = await getUserFavorites(userId);

		return jsonResponse(result);
    } catch (error) {
        console.error('Error retrieving favorites:', error);
		return jsonResponse({ message: 'Internal server error' }, 500);
    }
}