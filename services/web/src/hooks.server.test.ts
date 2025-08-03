import { describe, afterEach, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent, Cookies } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';
import { handle } from './hooks.server.js';
import type { UserPayload } from './types/user.js';

interface Locals {
	user: { id: number; name: string; email: string };
}

vi.mock('$env/static/private', () => ({
	JWT_SECRET: 'test-secret'
}));

const BASE_URL = 'http://localhost';

/**
 * Helper function to create a partial RequestEvent with a mocked cookies object.
 *
 * @param token - The JWT token (or undefined)
 * @param path - The path used for URL and route id
 * @returns A partial RequestEvent with mocked cookies and other required properties.
 */
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
	let dummyResolve: (args: Partial<RequestEvent>) => Promise<Response>;

	beforeEach(() => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		// Define a dummy resolver that simulates successful request handling
		dummyResolve = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })));
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('when a valid token is provided', () => {
		it('attaches the user to event.locals and calls resolve', async () => {
			const validPayload: UserPayload = { id: 1, email: 'user@example.com', name: 'Test User' };
			const token = 'valid-token';
			const event = createEvent(token, '/some-route') as RequestEvent;

			// Spy on jwt.verify so that it returns our valid payload
			const verifySpy = vi.spyOn(jwt, 'verify').mockImplementation(
				() =>
					({
						user: validPayload
					}) as jwt.JwtPayload
			);

			const response = await handle({ event, resolve: dummyResolve });

			expect(event.locals.user).toEqual(validPayload);
			expect(dummyResolve).toHaveBeenCalledWith(event);
			expect(response.status).toBe(200);
			expect(verifySpy).toHaveBeenCalledWith(token, JWT_SECRET);
		});
	});

	describe('when accessing protected routes', () => {
		it('redirects to /login if no token is provided', async () => {
			const event = createEvent(undefined, '/search') as RequestEvent;
			await expect(handle({ event, resolve: dummyResolve })).rejects.toMatchObject({
				status: 303,
				location: '/login'
			});
		});

		it('redirects to /login if an invalid token is provided', async () => {
			const token = 'invalid-token';
			const event = createEvent(token, '/search') as RequestEvent;
			const verifySpy = vi.spyOn(jwt, 'verify').mockImplementation(() => {
				throw new Error('Invalid token');
			});

			await expect(handle({ event, resolve: dummyResolve })).rejects.toMatchObject({
				status: 303,
				location: '/login'
			});
			expect(verifySpy).toHaveBeenCalledWith(token, JWT_SECRET);
		});
	});

	describe('when accessing non-protected routes', () => {
		it('does not redirect if no token is provided', async () => {
			const event = createEvent(undefined, '/not-protected') as RequestEvent;
			const response = await handle({ event, resolve: dummyResolve });
			expect(response.status).toBe(200);
		});
	});
});
