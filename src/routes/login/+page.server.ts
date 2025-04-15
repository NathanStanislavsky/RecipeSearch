import type { Actions } from './$types.js';
import { getUserByEmail } from '../../queries/user/select.js';
import type { RequestEvent } from '@sveltejs/kit';
import { AuthService } from '../../utils/auth/authService.ts';

export const actions: Actions = {
	default: async ({ request, cookies }: RequestEvent) => {
		try {
			const authService = AuthService.getInstance();

			// Get form data
			const formData = await request.formData();
			const email = formData.get('email')?.toString() || '';
			const password = formData.get('password')?.toString() || '';

			// Validate input
			const validation = authService.validateLoginForm(email, password);
			if (!validation.isValid) {
				return { success: false, message: validation.message };
			}

			// Look up the user by email
			const user = await getUserByEmail(email);
			if (!user) {
				return { success: false, message: 'Invalid credentials' };
			}

			// Validate credentials
			const isValid = await authService.validateCredentials(user, password);
			if (!isValid) {
				return { success: false, message: 'Invalid credentials' };
			}

			// Create and set JWT token
			const token = authService.createJwtToken(user);
			authService.setAuthCookie(cookies, token);

			// Return success on successful login
			return { success: true, message: 'Login successful' };
		} catch (error) {
			console.error(error);
			return { success: false, message: 'Login failed' };
		}
	}
};
