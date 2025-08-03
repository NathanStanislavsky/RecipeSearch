import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { actions } from './+page.server.js';
import { UserService } from '../../data/services/UserService.js';
import { ValidationError } from '../../utils/errors/AppError.js';
import { TestHelper } from '../../utils/test/testHelper.ts';
import { createFormDataRequest } from '../../utils/test/createTestRequestUtils.js';
import { TEST_USER } from '../../utils/test/userTestUtils.js';
import type { User, RegisterPayload } from '../../types/user.js';
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

	const mockUser: User = {
		id: TEST_USER.userId,
		email: TEST_USER.email,
		password: 'hashedPassword',
		name: TEST_USER.name
	};

	it('should register a new user when the email is unique', async () => {
		vi.spyOn(UserService.prototype, 'registerUser').mockResolvedValue(mockUser);

		const request = createRegisterRequest(createRegisterPayload());
		const event = createRegisterRequestEvent(request);

		// Expect a redirect throw for successful registration
		await expect(actions.default(event)).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
	});

	it('should return an error when the user already exists', async () => {
		vi.spyOn(UserService.prototype, 'registerUser').mockRejectedValue(
			new ValidationError('Email already registered')
		);

		const request = createRegisterRequest(createRegisterPayload());
		const event = createRegisterRequestEvent(request);

		const result = await actions.default(event);

		// Expect ActionFailure object with 400 status (ValidationError)
		expect(result).toMatchObject({
			status: 400,
			data: { message: 'Email already registered' }
		});
	});

	it('should return a 500 error when an exception is thrown', async () => {
		vi.spyOn(UserService.prototype, 'registerUser').mockRejectedValue(
			new Error('An unexpected error occurred')
		);

		const request = createRegisterRequest(createRegisterPayload());
		const event = createRegisterRequestEvent(request);

		const result = await actions.default(event);

		// Expect ActionFailure object
		expect(result).toMatchObject({
			status: 500,
			data: { message: 'An unexpected error occurred' }
		});
	});

	it('should validate email format', async () => {
		vi.spyOn(UserService.prototype, 'registerUser').mockRejectedValue(
			new ValidationError('Please provide a valid email address')
		);

		const request = createRegisterRequest(createRegisterPayload({ email: 'invalid-email' }));
		const event = createRegisterRequestEvent(request);

		const result = await actions.default(event);

		// Expect ActionFailure object
		expect(result).toMatchObject({
			status: 400,
			data: { message: 'Please provide a valid email address' }
		});
	});

	it('should validate password length', async () => {
		vi.spyOn(UserService.prototype, 'registerUser').mockRejectedValue(
			new ValidationError('Password must be at least 6 characters long')
		);

		const request = createRegisterRequest(createRegisterPayload({ password: '12345' }));
		const event = createRegisterRequestEvent(request);

		const result = await actions.default(event);

		// Expect ActionFailure object
		expect(result).toMatchObject({
			status: 400,
			data: { message: 'Password must be at least 6 characters long' }
		});
	});

	it('should validate name is not empty', async () => {
		vi.spyOn(UserService.prototype, 'registerUser').mockRejectedValue(
			new ValidationError('Name must be at least 2 characters long')
		);

		const request = createRegisterRequest(createRegisterPayload({ name: '' }));
		const event = createRegisterRequestEvent(request);

		const result = await actions.default(event);

		// Expect ActionFailure object
		expect(result).toMatchObject({
			status: 400,
			data: { message: 'Name must be at least 2 characters long' }
		});
	});

	it('should handle ValidationError properly', async () => {
		vi.spyOn(UserService.prototype, 'registerUser').mockRejectedValue(
			new ValidationError('Email and password are required')
		);

		const request = createRegisterRequest(createRegisterPayload({ email: '' }));
		const event = createRegisterRequestEvent(request);

		const result = await actions.default(event);

		// Expect ActionFailure object
		expect(result).toMatchObject({
			status: 400,
			data: { message: 'Email and password are required' }
		});
	});
});
