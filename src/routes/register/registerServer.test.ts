import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { POST } from './+server';
import * as selectModule from '../../queries/select';
import * as insertModule from '../../queries/insert';
import { createTestRequest } from '../../../test-utils/createTestRequest';

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

	const createRegisterPayload = (overrides = {}) => ({
		email: defaultEmail,
		password: defaultPassword,
		name: defaultName,
		...overrides
	});

	const createRegisterRequest = (payload: object) =>
		createTestRequest('http://localhost/register', 'POST', payload);

	it('should register a new user when the email is unique', async () => {
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(null);

		const mockUser = { id: 1, email: defaultEmail, name: defaultName };
		vi.spyOn(insertModule, 'createUser').mockResolvedValue(mockUser);
		const mockPasswordHash = vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');

		const reqPayload = createRegisterPayload();
		const request = createRegisterRequest(reqPayload);

		const response = await POST({ request });
		const data = await response.json();

		expect(response.status).toBe(201);
		expect(data).toHaveProperty('message', 'User registered successfully');
		expect(data).toHaveProperty('userId', mockUser.id);
		expect(mockPasswordHash).toHaveBeenCalledWith(defaultPassword, 10);
	});

	it('should return an error when the user already exists', async () => {
		const existingUser = { id: 123, email: defaultEmail };
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(existingUser);

		const reqPayload = createRegisterPayload();
		const request = createRegisterRequest(reqPayload);

		const response = await POST({ request });
		const data = await response.json();

		expect(response.status).toBe(409);
		expect(data).toHaveProperty('message', 'Email already registered');
	});

	it('should return a 500 error when an exception is thrown', async () => {
		vi.spyOn(selectModule, 'getUserByEmail').mockImplementation(() => {
			throw new Error('Simulated DB error');
		});

		const reqPayload = createRegisterPayload({ email: 'error@example.com', name: 'Error' });
		const request = createRegisterRequest(reqPayload);

		const response = await POST({ request });
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data).toHaveProperty('message', 'Internal Server Error');
	});
});