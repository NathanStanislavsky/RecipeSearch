import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

function verifyToken(token: string) {
	return jwt.verify(token, process.env.JWT_SECRET!) as unknown as {
		id: number;
		email: string;
		name: string;
	};
}

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('jwt');

	if (token) {
		try {
			const decoded = verifyToken(token);
			event.locals.user = decoded;
		} catch (error) {
			console.error('JWT verification failed:', error);
		}
	}

	if (event.url.pathname.startsWith('/search') && !event.locals.user) {
		throw redirect(303, '/login');
	}

	return await resolve(event);
};
