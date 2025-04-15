import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { actions } from './+page.server.js';
import * as selectModule from '../../queries/user/select.js';
import * as insertModule from '../../queries/user/insert.js';
import { TestHelper } from '../../utils/test/testHelper.ts';
import { createFormDataRequest } from '../../utils/test/createTestRequestUtils.js';
import { TEST_USER } from '../../utils/test/testConstants.js';
import type { User, RegisterPayload } from '../../types/user.ts';
import type { RequestEvent } from '@sveltejs/kit';

type RegisterRequestEvent = RequestEvent & {
	route: { id: '/register' };
};

describe('POST /register endpoint', () => {
	beforeAll(() => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	const createRegisterPayload = (overrides: Partial<RegisterPayload> = {}): RegisterPayload => ({
		email: TEST_USER.email,
		password: TEST_USER.correctPassword,
		name: TEST_USER.name,
		...overrides
	});

	const createRegisterRequest = (payload: RegisterPayload) => {
		const formData = new FormData();
		formData.append('email', payload.email);
		formData.append('password', payload.password);
		formData.append('name', payload.name);
		return createFormDataRequest('http://localhost/register', 'POST', formData);
	};

	const createRegisterRequestEvent = (request: Request): RegisterRequestEvent => {
		const event = TestHelper.createMockRequestEvent(request.url) as RegisterRequestEvent;
		return {
			...event,
			request,
			route: { id: '/register' }
		};
	};

	it('should register a new user when the email is unique', async () => {
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(null);

		const mockUser: User = {
			id: TEST_USER.userId,
			email: TEST_USER.email,
			password: 'hashedPassword',
			name: TEST_USER.name
		};
		vi.spyOn(insertModule, 'createUser').mockResolvedValue(mockUser);
		const mockPasswordHash = vi
			.spyOn(bcrypt, 'hash')
			.mockImplementation(async () => 'hashedPassword');

		const request = createRegisterRequest(createRegisterPayload());
		const event = createRegisterRequestEvent(request);

		const result = await actions.default(event);

		expect(result).toEqual({
			success: true,
			message: 'User registered successfully',
			userId: mockUser.id
		});
		expect(mockPasswordHash).toHaveBeenCalledWith(TEST_USER.correctPassword, 10);
	});

	it('should return an error when the user already exists', async () => {
		const existingUser: User = {
			id: TEST_USER.userId,
			email: TEST_USER.email,
			password: 'hashedPassword',
			name: TEST_USER.name
		};
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(existingUser);

		const request = createRegisterRequest(createRegisterPayload());
		const event = createRegisterRequestEvent(request);

		const result = await actions.default(event);

		expect(result).toEqual({
			success: false,
			message: 'Email already registered'
		});
	});

	it('should return a 500 error when an exception is thrown', async () => {
		vi.spyOn(selectModule, 'getUserByEmail').mockImplementation(() => {
			throw new Error('Simulated DB error');
		});

		const request = createRegisterRequest(createRegisterPayload());
		const event = createRegisterRequestEvent(request);

		const result = await actions.default(event);

		expect(result).toEqual({
			success: false,
			message: 'Failed to register'
		});
	});

	it('should validate email format', async () => {
		const request = createRegisterRequest(createRegisterPayload({ email: 'invalid-email' }));
		const event = createRegisterRequestEvent(request);

		const result = await actions.default(event);

		expect(result).toEqual({
			success: false,
			message: 'Invalid email format'
		});
	});

	it('should validate password length', async () => {
		const request = createRegisterRequest(createRegisterPayload({ password: '12345' }));
		const event = createRegisterRequestEvent(request);

		const result = await actions.default(event);

		expect(result).toEqual({
			success: false,
			message: 'Password must be at least 6 characters long'
		});
	});

	it('should validate name is not empty', async () => {
		const request = createRegisterRequest(createRegisterPayload({ name: '' }));
		const event = createRegisterRequestEvent(request);

		const result = await actions.default(event);

		expect(result).toEqual({
			success: false,
			message: 'Name is required'
		});
	});
});
