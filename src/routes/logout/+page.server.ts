import { redirect } from '@sveltejs/kit';

export const actions = {
	default: async (event) => {
		try {
			event.cookies.delete('jwt', { path: '/' });
		} catch (error) {
			console.error('Failed to delete jwt cookie', error);
		}
		throw redirect(302, '/');
	}
};
