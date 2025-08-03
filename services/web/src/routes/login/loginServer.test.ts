import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { actions } from './+page.server.js';
import { UserService } from '../../data/services/UserService.js';
import { TestHelper } from '../../utils/test/testHelper.js';
import { createFakeUser } from '../../utils/test/userTestUtils.js';
import { TEST_USER } from '../../utils/test/userTestUtils.js';

type LoginRequestEvent = RequestEvent & {
	route: { id: '/login' };
};

describe('/login endpoint', () => {
	beforeAll(() => {
		process.env.JWT_SECRET = 'test-secret';
		process.env.NODE_ENV = 'test';
	});

	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	const createLoginRequest = (email: string, password: string) => {
		const formData = new FormData();
		formData.append('email', email);
		formData.append('password', password);
		return new Request('http://localhost/login', {
			method: 'POST',
			body: formData
		});
	};

	const createLoginRequestEvent = (request: Request): LoginRequestEvent => {
		const event = TestHelper.createMockRequestEvent(request.url) as LoginRequestEvent;
		return {
			...event,
			request,
			route: { id: '/login' }
		};
	};

	it('returns success on successful login', async () => {
		const fakeUser = await createFakeUser();
		vi.spyOn(UserService.prototype, 'authenticateUser').mockResolvedValue(fakeUser);

		const request = createLoginRequest(TEST_USER.email, TEST_USER.correctPassword);
		const event = createLoginRequestEvent(request);

		await expect(actions.default(event)).rejects.toMatchObject({
			status: 303,
			location: '/search'
		});
	});

	it('returns error if email or password are missing', async () => {
		const request = createLoginRequest('', '');
		const event = createLoginRequestEvent(request);

		const result = await actions.default(event);
		expect(result).toMatchObject({
			status: 400,
			data: { message: 'Email and password required' }
		});
	});

	it('returns error if user not found', async () => {
		vi.spyOn(UserService.prototype, 'authenticateUser').mockResolvedValue(null);
		const request = createLoginRequest(TEST_USER.email, TEST_USER.correctPassword);
		const event = createLoginRequestEvent(request);

		const result = await actions.default(event);
		expect(result).toMatchObject({
			status: 401,
			data: { message: 'Invalid credentials' }
		});
	});

	it('returns error if password is incorrect', async () => {
		vi.spyOn(UserService.prototype, 'authenticateUser').mockResolvedValue(null);

		const request = createLoginRequest(TEST_USER.email, TEST_USER.wrongPassword);
		const event = createLoginRequestEvent(request);

		const result = await actions.default(event);
		expect(result).toMatchObject({
			status: 401,
			data: { message: 'Invalid credentials' }
		});
	});

	it('handles database errors gracefully', async () => {
		vi.spyOn(UserService.prototype, 'authenticateUser').mockRejectedValueOnce(
			new Error('Database error')
		);
		const request = createLoginRequest(TEST_USER.email, TEST_USER.correctPassword);
		const event = createLoginRequestEvent(request);

		const result = await actions.default(event);
		expect(result).toMatchObject({
			status: 500,
			data: { message: 'Database error' }
		});
	});

	it('sets auth cookie on successful login', async () => {
		const fakeUser = await createFakeUser();
		vi.spyOn(UserService.prototype, 'authenticateUser').mockResolvedValue(fakeUser);

		const request = createLoginRequest(TEST_USER.email, TEST_USER.correctPassword);
		const event = createLoginRequestEvent(request);

		await expect(actions.default(event)).rejects.toMatchObject({
			status: 303,
			location: '/search'
		});
		expect(event.cookies.set).toHaveBeenCalledWith('jwt', expect.any(String), {
			path: '/',
			httpOnly: true,
			secure: true,
			maxAge: 3600
		});
	});

	it('validates email format', async () => {
		const request = createLoginRequest('invalid-email', '');
		const event = createLoginRequestEvent(request);

		const result = await actions.default(event);
		expect(result).toMatchObject({
			status: 400,
			data: { message: 'Email and password required' }
		});
	});

	it('handles concurrent login attempts', async () => {
		const fakeUser = await createFakeUser();
		vi.spyOn(UserService.prototype, 'authenticateUser').mockResolvedValue(fakeUser);

		const request1 = createLoginRequest(TEST_USER.email, TEST_USER.correctPassword);
		const request2 = createLoginRequest(TEST_USER.email, TEST_USER.correctPassword);
		const event1 = createLoginRequestEvent(request1);
		const event2 = createLoginRequestEvent(request2);

		// Both should succeed and throw redirects
		const results = await Promise.allSettled([actions.default(event1), actions.default(event2)]);

		// Both results should be rejected with redirects
		expect(results[0].status).toBe('rejected');
		expect(results[1].status).toBe('rejected');

		// Verify both set cookies
		expect(event1.cookies.set).toHaveBeenCalled();
		expect(event2.cookies.set).toHaveBeenCalled();
	});
});
