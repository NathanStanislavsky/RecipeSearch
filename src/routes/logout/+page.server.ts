import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types.js';
import type { RequestEvent } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ cookies }: RequestEvent) => {
		cookies.delete('jwt', { path: '/' });
		throw redirect(302, '/');
	}
};
