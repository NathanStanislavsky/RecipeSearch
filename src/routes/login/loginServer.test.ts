import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import { POST } from './+server.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as selectModule from '../../queries/user/select.js';
import { assertResponse } from '../../utils/test/mockUtils.js';
import { createTestRequest } from '../../utils/test/createTestRequestUtils.js';

interface User {
	id: number;
	email: string;
	password: string;
	name: string;
}

interface LoginPayload {
	email: string;
	password: string;
}

type LoginRequestEvent = RequestEvent & {
	route: { id: '/login' };
};

describe('/login endpoint', () => {
	beforeAll(() => {
		process.env.JWT_SECRET = 'test-secret';
	});

	const defaultEmail = 'test@example.com';
	const correctPassword = 'correct-password';
	const wrongPassword = 'wrong-password';
	const defaultName = 'Test User';

	const createLoginPayload = (overrides: Partial<LoginPayload> = {}): LoginPayload => ({
		email: defaultEmail,
		password: correctPassword,
		...overrides
	});

	const createLoginRequest = (payload: LoginPayload) =>
		createTestRequest('http://localhost/login', 'POST', payload);

	const createFakeUser = async (password = correctPassword): Promise<User> => {
		const passwordHash = await bcrypt.hash(password, 10);
		return {
			id: 1,
			email: defaultEmail,
			password: passwordHash,
			name: defaultName
		};
	};

	const createRequestEvent = (request: Request): LoginRequestEvent => ({
		request,
		cookies: {
			get: vi.fn(),
			set: vi.fn(),
			delete: vi.fn(),
			serialize: vi.fn(),
			getAll: vi.fn()
		} as unknown as Cookies,
		fetch: vi.fn(),
		getClientAddress: () => '127.0.0.1',
		locals: {
			user: {
				id: 1,
				name: defaultName,
				email: defaultEmail
			}
		},
		params: {},
		platform: {},
		route: { id: '/login' },
		setHeaders: vi.fn(),
		url: new URL(request.url),
		isDataRequest: false,
		isSubRequest: false
	});

	it('returns valid token if login was successful', async () => {
		const fakeUser = await createFakeUser();
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(fakeUser);

		const reqPayload = createLoginPayload();
		const request = createLoginRequest(reqPayload);
		const event = createRequestEvent(request);

		const response = await POST(event);
		const expected = { success: true, token: expect.any(String) };

		const data = await assertResponse(response, 200, expected);
		const decodedToken = jwt.verify(data.token, process.env.JWT_SECRET || 'test-secret');
		expect(decodedToken).toMatchObject({
			userId: fakeUser.id,
			email: fakeUser.email
		});
	});

	it('if email or password were not in request then return 400 error', async () => {
		const request = createLoginRequest({ email: '', password: '' });
		const event = createRequestEvent(request);
		const response = await POST(event);
		await assertResponse(response, 400, { success: false, message: 'Email and password required' });
	});

	it('if email does not match user in database then return 401 error', async () => {
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(null);
		const reqPayload = createLoginPayload();
		const request = createLoginRequest(reqPayload);
		const event = createRequestEvent(request);
		const response = await POST(event);
		await assertResponse(response, 401, { success: false, message: 'Invalid credentials' });
	});

	it('if password does not match user in database then return 401 error', async () => {
		const fakeUser = await createFakeUser();
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(fakeUser);

		const reqPayload = createLoginPayload({ password: wrongPassword });
		const request = createLoginRequest(reqPayload);
		const event = createRequestEvent(request);
		const response = await POST(event);
		await assertResponse(response, 401, { success: false, message: 'Invalid credentials' });
	});
});
