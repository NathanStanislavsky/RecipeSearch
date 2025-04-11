import type { Cookies } from '@sveltejs/kit';

export const setAuthCookie = (cookies: Cookies, token: string): void => {
	cookies.set('jwt', token, {
		httpOnly: true,
		path: '/',
		maxAge: 3600,
		secure: true
	});
};
