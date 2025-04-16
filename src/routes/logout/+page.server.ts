import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types.js';

export const actions: Actions = {
	default: async (event) => {
		try {
			event.cookies.delete('jwt', { path: '/' });
		} catch (error) {
			console.error('Failed to delete jwt cookie', error);
		}
		throw redirect(302, '/');
	}
}
