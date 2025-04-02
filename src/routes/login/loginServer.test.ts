import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { POST } from './+server.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as selectModule from '../../queries/user/select.js';
import { assertResponse, mockRequestEvent } from '../../utils/test/mockUtils.js';
import { createTestRequest } from '../../utils/test/createTestRequestUtils.js';
import type { User, LoginPayload } from '../../types/user.ts';
import type { LoginResponse } from '../../types/user.ts';

type LoginRequestEvent = RequestEvent & {
	route: { id: '/login' };
};

describe('/login endpoint', () => {
	beforeAll(() => {
		process.env.JWT_SECRET = 'test-secret';
	});

	const TEST_CONSTANTS = {
		email: 'test@example.com',
		correctPassword: 'correct-password',
		wrongPassword: 'wrong-password',
		name: 'Test User',
		userId: 1
	} as const;

	const createLoginPayload = (overrides: Partial<LoginPayload> = {}): LoginPayload => ({
		email: TEST_CONSTANTS.email,
		password: TEST_CONSTANTS.correctPassword,
		...overrides
	});

	const createLoginRequest = (payload: LoginPayload) =>
		createTestRequest('http://localhost/login', 'POST', payload);

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

	const verifyLoginResponse = async (
		response: Response,
		expectedStatus: number,
		expectedData: LoginResponse
	) => {
		const data = (await assertResponse(response, expectedStatus, expectedData)) as LoginResponse;

		if (data.token) {
			const decodedToken = jwt.verify(data.token, process.env.JWT_SECRET || 'test-secret') as {
				userId: number;
				email: string;
			};
			expect(decodedToken).toMatchObject({
				userId: TEST_CONSTANTS.userId,
				email: TEST_CONSTANTS.email
			});
		}

		return data;
	};

	it('returns valid token if login was successful', async () => {
		const fakeUser = await createFakeUser();
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(fakeUser);

		const reqPayload = createLoginPayload();
		const request = createLoginRequest(reqPayload);
		const event = createLoginRequestEvent(request);

		const response = await POST(event);
		await verifyLoginResponse(response, 200, { success: true, token: expect.any(String) });
	});

	it('if email or password were not in request then return 400 error', async () => {
		const request = createLoginRequest({ email: '', password: '' });
		const event = createLoginRequestEvent(request);
		const response = await POST(event);
		await verifyLoginResponse(response, 400, {
			success: false,
			message: 'Email and password required'
		});
	});

	it('if email does not match user in database then return 401 error', async () => {
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(null);
		const reqPayload = createLoginPayload();
		const request = createLoginRequest(reqPayload);
		const event = createLoginRequestEvent(request);
		const response = await POST(event);
		await verifyLoginResponse(response, 401, {
			success: false,
			message: 'Invalid credentials'
		});
	});

	it('if password does not match user in database then return 401 error', async () => {
		const fakeUser = await createFakeUser();
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(fakeUser);

		const reqPayload = createLoginPayload({ password: TEST_CONSTANTS.wrongPassword });
		const request = createLoginRequest(reqPayload);
		const event = createLoginRequestEvent(request);
		const response = await POST(event);
		await verifyLoginResponse(response, 401, {
			success: false,
			message: 'Invalid credentials'
		});
	});
});
