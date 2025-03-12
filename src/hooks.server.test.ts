import { describe, beforeAll, afterAll, afterEach, it, expect, vi } from 'vitest';
import { handle } from './hooks.server';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost';

function createEvent(token: string | undefined, path: string) {
	return {
		cookies: {
			get: vi.fn().mockReturnValue(token)
		},
		url: new URL(`${BASE_URL}${path}`),
		locals: {}
	};
}

describe('hooks.server', () => {
	beforeAll(() => {
		process.env.JWT_SECRET = 'test-secret';
	});

	afterAll(() => {
		delete process.env.JWT_SECRET;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	const dummyResolve = vi.fn((event) => Promise.resolve({ status: 200 }));

	it('attaches user to event.locals when a valid token is provided', async () => {
		const validPayload = { id: 1, email: 'user@example.com', name: 'Test User' };
		const token = 'valid-token';

		const event: any = createEvent(token, '/some-route');

		const verifySpy = vi.spyOn(jwt, 'verify').mockReturnValue(validPayload as any);

		const response = await handle({ event, resolve: dummyResolve });
		expect(event.locals.user).toEqual(validPayload);
		expect(dummyResolve).toHaveBeenCalledWith(event);
		expect(response).toEqual({ status: 200 });
		expect(verifySpy).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
	});

	it('redirects to /login when accessing a protected route without a token', async () => {
		// Create an event for a protected route (/search) with no token
		const event: any = createEvent(undefined, '/search');
		await expect(handle({ event, resolve: dummyResolve })).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
	});

	it('redirects to /login when accessing a protected route with an invalid token', async () => {
		const token = 'invalid-token';
		const event: any = createEvent(token, '/search');

		// Simulate jwt.verify throwing an error for an invalid token
		const verifySpy = vi.spyOn(jwt, 'verify').mockImplementation(() => {
			throw new Error('Invalid token');
		});

		await expect(handle({ event, resolve: dummyResolve })).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
		expect(verifySpy).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
	});

	it('does not redirect for non-protected routes even if no token is provided', async () => {
		const event: any = createEvent(undefined, '/not-protected');
		const response = await handle({ event, resolve: dummyResolve });
		expect(response).toEqual({ status: 200 });
	});
});