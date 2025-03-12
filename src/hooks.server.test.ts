import { describe, beforeAll, afterAll, afterEach, it, expect, vi } from 'vitest';
import { handle } from './hooks.server';
import jwt from 'jsonwebtoken';

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

		const event: any = {
			cookies: {
				get: vi.fn().mockReturnValue(token)
			},
			url: new URL('http://localhost/some-route'),
			locals: {}
		};

		const verifySpy = vi.spyOn(jwt, 'verify').mockReturnValue(validPayload as any);

		const response = await handle({ event, resolve: dummyResolve });
		expect(event.locals.user).toEqual(validPayload);
		expect(dummyResolve).toHaveBeenCalledWith(event);
		expect(response).toEqual({ status: 200 });
		expect(verifySpy).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
	});
});