import type { Actions } from './$types.js';
import { getUserByEmail } from '../../queries/user/select.js';
import type { RequestEvent } from '@sveltejs/kit';
import { AuthService } from '../../utils/auth/authService.js';
import { error } from '@sveltejs/kit';
import { JWT_SECRET } from '$env/static/private';
import { ValidationError, AuthError, handleError } from '$utils/errors/AppError.js';

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
				throw new ValidationError('Email and password required');
			}

			// Look up the user by email.
			const user = await getUserByEmail(email);
			if (!user) {
				throw new AuthError('Invalid credentials');
			}

			// Validate credentials.
			const isValid = await authService.validateCredentials(user, password);
			if (!isValid) {
				throw new AuthError('Invalid credentials');
			}

			// Create and set JWT token.
			const token = authService.createJwtToken(user);
			authService.setAuthCookie(cookies, token);

			// Return success on successful login.
			return { success: true, message: 'Login successful' };
		} catch (err: unknown) {
			const errorResponse = handleError(err, 'Login');
			throw error(errorResponse.status, errorResponse.message);
		}
	}
};
