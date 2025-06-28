import type { Actions } from './$types.js';
import { getUserByEmail } from '../../queries/user/select.js';
import type { RequestEvent } from '@sveltejs/kit';
import { AuthService } from '../../utils/auth/authService.js';
import { fail, redirect } from '@sveltejs/kit';
import { JWT_SECRET } from '$env/static/private';
import { handleError } from '$utils/errors/AppError.js';

export const actions: Actions = {
	default: async ({ request, cookies }: RequestEvent) => {
		try {
			const authService = new AuthService(JWT_SECRET);

			// Get form data.
			const formData = await request.formData();
			const email = formData.get('email')?.toString() || '';
			const password = formData.get('password')?.toString() || '';

			// Validate input.
			const validation = authService.validateLoginForm(email, password);
			if (!validation.isValid) {
				return fail(400, { message: 'Email and password required' });
			}

			// Look up the user by email.
			const user = await getUserByEmail(email);
			if (!user) {
				return fail(401, { message: 'Invalid credentials' });
			}

			// Validate credentials.
			const isValid = await authService.validateCredentials(user, password);
			if (!isValid) {
				return fail(401, { message: 'Invalid credentials' });
			}

			// Create and set JWT token.
			const token = authService.createJwtToken(user);
			authService.setAuthCookie(cookies, token);

			// Redirect to search page on successful login.
			throw redirect(303, '/search');
		} catch (err: unknown) {
			// Handle redirect throws (these are expected)
			if (err && typeof err === 'object' && 'status' in err && err.status === 303) {
				throw err;
			}

			// Handle other errors
			const errorResponse = handleError(err, 'Login');
			return fail(errorResponse.status, { message: errorResponse.message });
		}
	}
};
