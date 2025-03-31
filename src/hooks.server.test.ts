import { describe, afterEach, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';
import { handle } from './hooks.server.js';

interface UserPayload {
	id: number;
	email: string;
	name: string;
}

interface Locals {
	user: { id: number; name: string; email: string };
}

vi.mock('$env/static/private', () => ({
	JWT_SECRET: 'test-secret'
}));

const BASE_URL = 'http://localhost';

function createEvent(token: string | undefined, path: string): Partial<RequestEvent> {
	return {
		cookies: {
			get: vi.fn().mockReturnValue(token),
			set: vi.fn(),
			delete: vi.fn(),
			serialize: vi.fn(),
			getAll: vi.fn().mockReturnValue([])
		} as unknown as Cookies,
		url: new URL(`${BASE_URL}${path}`),
		locals: {} as Locals,
		fetch: vi.fn(),
		getClientAddress: vi.fn(),
		params: {},
		platform: 'node',
		route: { id: path },
		request: new Request(`${BASE_URL}${path}`)
	};
}

describe('hooks.server', () => {
	beforeEach(() => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	const dummyResolve = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })));

	it('attaches user to event.locals when a valid token is provided', async () => {
		const validPayload: UserPayload = { id: 1, email: 'user@example.com', name: 'Test User' };
		const token = 'valid-token';

		const event = createEvent(token, '/some-route') as unknown as RequestEvent;

		const verifySpy = vi
			.spyOn(jwt, 'verify')
			.mockImplementation(() => ({ payload: validPayload }) as jwt.JwtPayload);

		const response = await handle({ event, resolve: dummyResolve });
		expect(event.locals.user).toEqual(validPayload);
		expect(dummyResolve).toHaveBeenCalledWith(event);
		expect(response.status).toBe(200);
		// Use the imported JWT_SECRET instead of process.env.JWT_SECRET
		expect(verifySpy).toHaveBeenCalledWith(token, JWT_SECRET);
	});

	it('redirects to /login when accessing a protected route without a token', async () => {
		// Create an event for a protected route (/search) with no token
		const event = createEvent(undefined, '/search') as unknown as RequestEvent;
		await expect(handle({ event, resolve: dummyResolve })).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
	});

	it('redirects to /login when accessing a protected route with an invalid token', async () => {
		const token = 'invalid-token';
		const event = createEvent(token, '/search') as unknown as RequestEvent;

		// Simulate jwt.verify throwing an error for an invalid token
		const verifySpy = vi.spyOn(jwt, 'verify').mockImplementation(() => {
			throw new Error('Invalid token');
		});

		await expect(handle({ event, resolve: dummyResolve })).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
		expect(verifySpy).toHaveBeenCalledWith(token, JWT_SECRET);
	});

	it('does not redirect for non-protected routes even if no token is provided', async () => {
		const event = createEvent(undefined, '/not-protected') as unknown as RequestEvent;
		const response = await handle({ event, resolve: dummyResolve });
		expect(response.status).toBe(200);
	});
});
