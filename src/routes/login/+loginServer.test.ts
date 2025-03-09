import { describe, it, expect, vi, beforeAll } from 'vitest';
import { POST } from './+server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as selectModule from '../../queries/select';
import { assertResponse } from '../../../test-utils/mockUtils';
import { createTestRequest } from '../../../test-utils/createTestRequest';

describe('/login endpoint', () => {
	beforeAll(() => {
		process.env.JWT_SECRET = 'test-secret';
	});

	it('returns valid token if login was successful', async () => {
		const passwordHash = await bcrypt.hash('correct-password', 10);
		const fakeUser = {
			id: 1,
			email: 'test@example.com',
			passwordHash
		};

		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(fakeUser);

		const reqPayload = {
			email: 'test@example.com',
			password: 'correct-password'
		};

		const request = createTestRequest('http://localhost/login', 'POST', reqPayload);

		const response = await POST({ request });
		const expected = { success: true, token: expect.any(String) };

		const data = await assertResponse(response, 200, expected);

		const decodedToken = jwt.verify(data.token, process.env.JWT_SECRET);
		expect(decodedToken).toMatchObject({
			userId: fakeUser.id,
			email: fakeUser.email
		});
	});

	it('if email or password were not in request then return 400 error', async () => {
		const reqPayload = {};

		const request = createTestRequest('http://localhost/login', 'POST', reqPayload);

		const response = await POST({ request });

		await assertResponse(response, 400, { message: 'Email and password required' });
	});

	it('if email does not match user in database then return 401 error', async () => {
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(null);

		const reqPayload = {
			email: 'test@example.com',
			password: 'correct-password'
		};

		const request = createTestRequest('http://localhost/login', 'POST', reqPayload);

		const response = await POST({ request });
		await assertResponse(response, 401, { message: 'Invalid credentials' });
	});

	it('if password does not match user in database then return 401 error', async () => {
		const passwordHash = await bcrypt.hash('correct-password', 10);
		const fakeUser = {
			id: 1,
			email: 'test@example.com',
			passwordHash
		};

		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(fakeUser);

		const reqPayload = {
			email: 'test@example.com',
			password: 'wrong-password'
		};

		const request = createTestRequest('http://localhost/login', 'POST', reqPayload);

		const response = await POST({ request });
		
		await assertResponse(response, 401, { message: 'Invalid credentials' });
	});
});