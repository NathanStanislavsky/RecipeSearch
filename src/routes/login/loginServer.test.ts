import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { actions } from './+page.server.js';
import * as selectModule from '../../queries/user/select.js';
import { TestHelper } from '../../utils/test/testHelper.ts';
import { createFakeUser } from '../../utils/test/userTestUtils.js';
import { TEST_USER } from '../../utils/test/testConstants.js';

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
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(fakeUser);

		const request = createLoginRequest(TEST_USER.email, TEST_USER.correctPassword);
		const event = createLoginRequestEvent(request);

		const result = await actions.default(event);
		expect(result).toEqual({ success: true, message: 'Login successful' });
	});

	it('returns error if email or password are missing', async () => {
		const request = createLoginRequest('', '');
		const event = createLoginRequestEvent(request);

		await expect(actions.default(event)).rejects.toMatchObject({
			status: 400,
			body: { message: 'Email and password required' }
		});
	});

	it('returns error if user not found', async () => {
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(null);
		const request = createLoginRequest(TEST_USER.email, TEST_USER.correctPassword);
		const event = createLoginRequestEvent(request);

		await expect(actions.default(event)).rejects.toMatchObject({
			status: 401,
			body: { message: 'Invalid credentials' }
		});
	});

	it('returns error if password is incorrect', async () => {
		const fakeUser = await createFakeUser();
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(fakeUser);

		const request = createLoginRequest(TEST_USER.email, TEST_USER.wrongPassword);
		const event = createLoginRequestEvent(request);

		await expect(actions.default(event)).rejects.toMatchObject({
			status: 401,
			body: { message: 'Invalid credentials' }
		});
	});

	it('handles database errors gracefully', async () => {
		vi.spyOn(selectModule, 'getUserByEmail').mockRejectedValue(new Error('Database error'));
		const request = createLoginRequest(TEST_USER.email, TEST_USER.correctPassword);
		const event = createLoginRequestEvent(request);

		await expect(actions.default(event)).rejects.toMatchObject({
			status: 500,
			body: { message: 'Login failed' }
		});
	});

	it('sets auth cookie on successful login', async () => {
		const fakeUser = await createFakeUser();
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(fakeUser);

		const request = createLoginRequest(TEST_USER.email, TEST_USER.correctPassword);
		const event = createLoginRequestEvent(request);

		await actions.default(event);
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

		await expect(actions.default(event)).rejects.toMatchObject({
			status: 400,
			body: { message: 'Email and password required' }
		});
	});

	it('handles concurrent login attempts', async () => {
		const fakeUser = await createFakeUser();
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(fakeUser);

		const request1 = createLoginRequest(TEST_USER.email, TEST_USER.correctPassword);
		const request2 = createLoginRequest(TEST_USER.email, TEST_USER.correctPassword);
		const event1 = createLoginRequestEvent(request1);
		const event2 = createLoginRequestEvent(request2);

		const [result1, result2] = await Promise.all([
			actions.default(event1),
			actions.default(event2)
		]);

		expect(result1).toEqual({ success: true, message: 'Login successful' });
		expect(result2).toEqual({ success: true, message: 'Login successful' });
		expect(event1.cookies.set).toHaveBeenCalled();
		expect(event2.cookies.set).toHaveBeenCalled();
	});
});
