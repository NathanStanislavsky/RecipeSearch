import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';

/**
 * Interface representing a user payload in the JWT token
 */
interface UserPayload {
	id: number;
	email: string;
	name: string;
}

/**
 * Verifies and decodes a JWT token
 * @param token - The JWT token to verify
 * @returns The decoded user payload
 * @throws Error if token verification fails
 */
function verifyToken(token: string): UserPayload {
	try {
		const decoded = jwt.verify(token, JWT_SECRET);

		if (typeof decoded === 'object' && decoded !== null) {
			if ('payload' in decoded) {
				return (decoded as { payload: UserPayload }).payload;
			}

			// The login endpoint uses userId instead of id
			if ('userId' in decoded && 'email' in decoded) {
				// Convert from login token format to UserPayload format
				return {
					id: (decoded as { userId: number }).userId,
					email: (decoded as { email: string }).email,
					name: (decoded as { name: string }).name || 'User' // Default name if not present
				};
			}

			// Validate that the decoded object has the required properties
			const userPayload = decoded as UserPayload;
			if (typeof userPayload.id !== 'number' && typeof userPayload.email !== 'string') {
				throw new Error('Invalid token structure');
			}

			return userPayload;
		}

		throw new Error('Invalid token payload format');
	} catch (error) {
		if (error instanceof jwt.JsonWebTokenError) {
			throw new Error(`JWT verification failed: ${error.message}`);
		}
		throw error;
	}
}

/**
 * SvelteKit handle function for processing requests
 */
export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('jwt');

	if (token) {
		try {
			const decoded = verifyToken(token);
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

	// Protected routes that require authentication
	const protectedRoutes = ['/search'];
	const isProtectedRoute = protectedRoutes.some((route) => event.url.pathname.startsWith(route));

	if (isProtectedRoute && !event.locals.user) {
		throw redirect(303, '/login');
	}

	return await resolve(event);
};
