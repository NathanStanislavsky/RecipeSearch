import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { actions } from './+page.server.js';
import bcrypt from 'bcryptjs';
import * as selectModule from '../../queries/user/select.js';
import { mockRequestEvent } from '../../utils/test/mockUtils.js';
import type { User } from '../../types/user.ts';

type LoginRequestEvent = RequestEvent & {
	route: { id: '/login' };
	locals: { user: { id: number; name: string; email: string } | null };
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

	const TEST_CONSTANTS = {
		email: 'test@example.com',
		correctPassword: 'correct-password',
		wrongPassword: 'wrong-password',
		name: 'Test User',
		userId: 1
	} as const;

	const createLoginRequest = (email: string, password: string) => {
		const formData = new FormData();
		formData.append('email', email);
		formData.append('password', password);
		return new Request('http://localhost/login', {
			method: 'POST',
			body: formData
		});
	};

	const createFakeUser = async (password = TEST_CONSTANTS.correctPassword): Promise<User> => {
		const passwordHash = await bcrypt.hash(password, 10);
		return {
			id: TEST_CONSTANTS.userId,
			email: TEST_CONSTANTS.email,
			password: passwordHash,
			name: TEST_CONSTANTS.name
		};
	};

	const createLoginRequestEvent = (request: Request): LoginRequestEvent => {
		const event = mockRequestEvent(request.url) as LoginRequestEvent;
		return {
			...event,
			request,
			route: { id: '/login' },
			locals: {
				user: {
					id: TEST_CONSTANTS.userId,
					name: TEST_CONSTANTS.name,
					email: TEST_CONSTANTS.email
				}
			}
		};
	};

	it('returns undefined on successful login', async () => {
		const fakeUser = await createFakeUser();
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(fakeUser);

		const request = createLoginRequest(TEST_CONSTANTS.email, TEST_CONSTANTS.correctPassword);
		const event = createLoginRequestEvent(request);

		const result = await actions.default(event);
		expect(result).toBeUndefined();
	});

	it('returns error if email or password are missing', async () => {
		const request = createLoginRequest('', '');
		const event = createLoginRequestEvent(request);

		const result = await actions.default(event);
		expect(result).toEqual({
			success: false,
			message: 'Email and password required'
		});
	});

	it('returns error if user not found', async () => {
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(null);
		const request = createLoginRequest(TEST_CONSTANTS.email, TEST_CONSTANTS.correctPassword);
		const event = createLoginRequestEvent(request);

		const result = await actions.default(event);
		expect(result).toEqual({
			success: false,
			message: 'Invalid credentials'
		});
	});

	it('returns error if password is incorrect', async () => {
		const fakeUser = await createFakeUser();
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(fakeUser);

		const request = createLoginRequest(TEST_CONSTANTS.email, TEST_CONSTANTS.wrongPassword);
		const event = createLoginRequestEvent(request);

		const result = await actions.default(event);
		expect(result).toEqual({
			success: false,
			message: 'Invalid credentials'
		});
	});

	it('handles database errors gracefully', async () => {
		vi.spyOn(selectModule, 'getUserByEmail').mockRejectedValue(new Error('Database error'));
		const request = createLoginRequest(TEST_CONSTANTS.email, TEST_CONSTANTS.correctPassword);
		const event = createLoginRequestEvent(request);

		const result = await actions.default(event);
		expect(result).toEqual({
			success: false,
			message: 'Login failed'
		});
	});

	it('sets auth cookie on successful login', async () => {
		const fakeUser = await createFakeUser();
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(fakeUser);

		const request = createLoginRequest(TEST_CONSTANTS.email, TEST_CONSTANTS.correctPassword);
		const event = createLoginRequestEvent(request);

		await actions.default(event);
		expect(event.cookies.set).toHaveBeenCalledWith(
			'jwt',
			expect.any(String),
			{
				path: '/',
				httpOnly: true,
				secure: true,
				maxAge: 3600
			}
		);
	});

	it('validates email format', async () => {
		const request = createLoginRequest('invalid-email', '');
		const event = createLoginRequestEvent(request);

		const result = await actions.default(event);
		expect(result).toEqual({
			success: false,
			message: 'Email and password required'
		});
	});

	it('handles concurrent login attempts', async () => {
		const fakeUser = await createFakeUser();
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(fakeUser);

		const request1 = createLoginRequest(TEST_CONSTANTS.email, TEST_CONSTANTS.correctPassword);
		const request2 = createLoginRequest(TEST_CONSTANTS.email, TEST_CONSTANTS.correctPassword);
		const event1 = createLoginRequestEvent(request1);
		const event2 = createLoginRequestEvent(request2);

		const [result1, result2] = await Promise.all([
			actions.default(event1),
			actions.default(event2)
		]);

		expect(result1).toBeUndefined();
		expect(result2).toBeUndefined();
		expect(event1.cookies.set).toHaveBeenCalled();
		expect(event2.cookies.set).toHaveBeenCalled();
	});
});
