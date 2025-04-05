import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { actions } from './+page.server.js';
import * as selectModule from '../../queries/user/select.js';
import * as insertModule from '../../queries/user/insert.js';
import type { User, RegisterPayload } from '../../types/user.ts';

const createRegisterRequest = (payload: RegisterPayload) => {
	const formData = new FormData();
	formData.append('email', payload.email);
	formData.append('password', payload.password);
	formData.append('name', payload.name);
	return new Request('http://localhost/register', {
		method: 'POST',
		body: formData
	});
};

describe('POST /register endpoint', () => {
	beforeAll(() => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	const defaultEmail = 'test@example.com';
	const defaultPassword = 'password';
	const defaultName = 'Test';

	const createRegisterPayload = (overrides: Partial<RegisterPayload> = {}): RegisterPayload => ({
		email: defaultEmail,
		password: defaultPassword,
		name: defaultName,
		...overrides
	});

	const createRegisterRequestEvent = (request: Request) => {
		const url = new URL(request.url);
		return {
			request,
			cookies: {
				get: vi.fn(),
				getAll: vi.fn(),
				set: vi.fn(),
				delete: vi.fn(),
				serialize: vi.fn()
			},
			fetch: vi.fn(),
			getClientAddress: () => '127.0.0.1',
			locals: {
				user: {
					id: 0,
					name: '',
					email: ''
				}
			},
			params: {},
			platform: {},
			route: { id: '/register' as const },
			url,
			setHeaders: vi.fn(),
			isDataRequest: false,
			isSubRequest: false
		};
	};

	it('should register a new user when the email is unique', async () => {
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(null);

		const mockUser: User = {
			id: 1,
			email: defaultEmail,
			password: 'hashedPassword',
			name: defaultName
		};
		vi.spyOn(insertModule, 'createUser').mockResolvedValue(mockUser);
		const mockPasswordHash = vi
			.spyOn(bcrypt, 'hash')
			.mockImplementation(async () => 'hashedPassword');

		const reqPayload = createRegisterPayload();
		const request = createRegisterRequest(reqPayload);
		const event = createRegisterRequestEvent(request);

		const result = await actions.default(event);

		expect(result).toEqual({
			success: true,
			message: 'User registered successfully',
			userId: mockUser.id
		});
		expect(mockPasswordHash).toHaveBeenCalledWith(defaultPassword, 10);
	});

	it('should return an error when the user already exists', async () => {
		const existingUser: User = {
			id: 123,
			email: defaultEmail,
			password: 'hashedPassword',
			name: defaultName
		};
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(existingUser);

		const reqPayload = createRegisterPayload();
		const request = createRegisterRequest(reqPayload);
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

		const reqPayload = createRegisterPayload({ email: 'error@example.com', name: 'Error' });
		const request = createRegisterRequest(reqPayload);
		const event = createRegisterRequestEvent(request);

		const result = await actions.default(event);

		expect(result).toEqual({
			success: false,
			message: 'Failed to register'
		});
	});
});
