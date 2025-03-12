import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('jwt');

	if (token) {
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET!) as unknown as {
                id: number;
                email: string;
                name: string;
            };

			event.locals.user = decoded;
		} catch (error) {
			console.error('JWT verification failed:', error);
		}
	}

	return await resolve(event);
};
