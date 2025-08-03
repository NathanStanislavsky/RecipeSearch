import type { Actions } from './$types.js';
import { type RequestEvent, fail, redirect } from '@sveltejs/kit';
import { handleError } from '../../utils/errors/AppError.js';
import { UserService } from '../../data/services/UserService.js';

const userService = new UserService();

export const actions: Actions = {
	default: async ({ request }: RequestEvent) => {
		try {
			const formData = await request.formData();
			const email = formData.get('email')?.toString() || '';
			const password = formData.get('password')?.toString() || '';
			const name = formData.get('name')?.toString() || '';

			await userService.registerUser({
				email,
				name,
				password
			});

			throw redirect(303, '/login');
		} catch (error) {
			if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
				throw error;
			}

			// Handle other errors
			const errorResponse = handleError(error, 'Registration');
			return fail(errorResponse.status, { message: errorResponse.message });
		}
	}
};
