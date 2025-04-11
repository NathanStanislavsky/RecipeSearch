import { AuthService } from '$utils/auth/authService.ts';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

/**
 * Constants for protected routes and cookie settings
 */
const PROTECTED_ROUTES = ['/search'] as const;

/**
 * SvelteKit handle function for processing requests
 */
export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('jwt');
	const authService = AuthService.getInstance();

	if (token) {
		try {
			const decoded = authService.verifyToken(token);
			event.locals.user = decoded;
		} catch (error) {
			console.error(
				'JWT verification failed:',
				error instanceof Error ? error.message : 'Unknown error'
			);
			// Clear the invalid token
			event.cookies.delete('jwt', { path: '/' });
		}
	}

	// Check if current route requires authentication
	const isProtectedRoute = PROTECTED_ROUTES.some((route) => event.url.pathname.startsWith(route));

	if (isProtectedRoute && !event.locals.user) {
		throw redirect(303, '/login');
	}

	return await resolve(event);
};
