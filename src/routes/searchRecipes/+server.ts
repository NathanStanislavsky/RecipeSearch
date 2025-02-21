import type { RequestHandler } from '@sveltejs/kit';
import { RAPIDAPI_KEY } from '$env/static/private';

export const GET: RequestHandler = async ({ url }) => {
	const ingredients = url.searchParams.get('ingredients');
	if (!ingredients) {
		return new Response(JSON.stringify({ error: 'Missing required parameter: ingredients' }), {
			status: 400
		});
	}
};
