import { AuthService } from '$utils/auth/authService.js';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { JWT_SECRET } from '$env/static/private';
import { handleError } from '$utils/errors/AppError.js';

/**
 * Constants for protected routes and cookie settings
 */
const PROTECTED_ROUTES = ['/search'] as const;

/**
 * SvelteKit handle function for processing requests
 */
export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('jwt');
	const authService = new AuthService(JWT_SECRET);

	if (token) {
		try {
			const decoded = authService.verifyToken(token);
			event.locals.user = decoded;
		} catch (error) {
			handleError(error, 'JWT Verification');
			console.log('JWT Verification error:', error);
			// Clear the invalid token
			event.cookies.delete('jwt', { path: '/' });
		}
	}

	// Check if current route requires authentication
	const isProtectedRoute = PROTECTED_ROUTES.some((route) => event.url.pathname.startsWith(route));

	if (isProtectedRoute && !event.locals.user) {
		throw redirect(303, '/login');
	}

	return resolve(event);
};
