import type { Actions } from './$types.js';
import { getUserByEmail } from '../../queries/user/select.js';
import type { RequestEvent } from '@sveltejs/kit';
import { AuthService } from '../../utils/auth/authService.js';
import { error } from '@sveltejs/kit';

interface HttpError {
	status: number;
	body: { message: string };
}

export const actions: Actions = {
	default: async ({ request, cookies }: RequestEvent) => {
		try {
			const authService = AuthService.getInstance();

			// Get form data.
			const formData = await request.formData();
			const email = formData.get('email')?.toString() || '';
			const password = formData.get('password')?.toString() || '';

			// Validate input.
			const validation = authService.validateLoginForm(email, password);
			if (!validation.isValid) {
				throw error(400, 'Email and password required');
			}

			// Look up the user by email.
			const user = await getUserByEmail(email);
			if (!user) {
				throw error(401, 'Invalid credentials');
			}

			// Validate credentials.
			const isValid = await authService.validateCredentials(user, password);
			if (!isValid) {
				throw error(401, 'Invalid credentials');
			}

			// Create and set JWT token.
			const token = authService.createJwtToken(user);
			authService.setAuthCookie(cookies, token);

			// Return success on successful login.
			return { success: true, message: 'Login successful' };
		} catch (err: unknown) {
			console.error(err);
			// if error has a `status` property, assume it is an HttpError.
			if (
				err &&
				typeof err === 'object' &&
				'status' in err &&
				'body' in err &&
				typeof (err as HttpError).status === 'number'
			) {
				throw err;
			}
			// For any unexpected errors, throw a 500 error.
			throw error(500, 'Login failed');
		}
	}
};
