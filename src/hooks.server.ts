import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';

interface UserPayload {
	id: number;
	email: string;
	name: string;
}

function verifyToken(token: string): UserPayload {
	const decoded = jwt.verify(token, JWT_SECRET);
	
	if (typeof decoded === 'object' && decoded !== null) {
		if ('payload' in decoded) {
			return (decoded as { payload: UserPayload }).payload;
		}
		return decoded as UserPayload;
	}

	throw new Error('Invalid token payload');
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