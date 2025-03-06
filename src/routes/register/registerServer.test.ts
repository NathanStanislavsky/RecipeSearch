import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { POST } from './+server';
import * as selectModule from '../../queries/select';
import * as insertModule from '../../queries/insert';

describe('POST /register endpoint', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should register a new user when the email is unique', async () => {
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(null);

		const mockUser = { id: 1, email: 'test@example.com', name: 'Test' };
		vi.spyOn(insertModule, 'createUser').mockResolvedValue(mockUser);

		const mockPasswordHash = vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');

		const reqBody = JSON.stringify({
			email: 'test@example.com',
			password: 'password',
			name: 'Test'
		});

		const request = new Request('http://localhost/register', {
			method: 'POST',
			body: reqBody
		});

		const response = await POST({ request });
		const data = await response.json();

		expect(response.status).toBe(201);
		expect(data).toHaveProperty('message', 'User registered successfully');
		expect(data).toHaveProperty('userId', mockUser.id);
		expect(mockPasswordHash).toHaveBeenCalledWith('password', 10);
	});

	it('should return an error when the user already exists', async () => {
		const existingUser = { id: 123, email: 'test@example.com' };
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(existingUser);

		const reqBody = JSON.stringify({
			email: 'test@example.com',
			password: 'password',
			name: 'Test'
		});

		const request = new Request('http://localhost/register', {
			method: 'POST',
			body: reqBody
		});

		const response = await POST({ request });
		const data = await response.json();

		expect(response.status).toBe(409);
		expect(data).toHaveProperty('message', 'Email already registered');
	});

	it('should return a 500 error when an exception is thrown', async () => {
		vi.spyOn(selectModule, 'getUserByEmail').mockImplementation(() => {
			throw new Error('Simulated DB error');
		});

		const reqBody = JSON.stringify({
			email: 'error@example.com',
			password: 'password',
			name: 'Error'
		});

		const request = new Request('http://localhost/register', {
			method: 'POST',
			body: reqBody
		});

		const response = await POST({ request });
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data).toHaveProperty('message', 'Internal Server Error');
	});
});
