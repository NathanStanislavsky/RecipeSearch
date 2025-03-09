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

	const defaultEmail = 'test@example.com';
	const correctPassword = 'correct-password';
	const wrongPassword = 'wrong-password';

	const createLoginPayload = (overrides = {}) => ({
		email: defaultEmail,
		password: correctPassword,
		...overrides
	});

	const createLoginRequest = (payload: object) =>
		createTestRequest('http://localhost/login', 'POST', payload);

	const createFakeUser = async (password = correctPassword) => {
		const passwordHash = await bcrypt.hash(password, 10);
		return {
			id: 1,
			email: defaultEmail,
			passwordHash
		};
	};

	it('returns valid token if login was successful', async () => {
		const fakeUser = await createFakeUser();
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(fakeUser);

		const reqPayload = createLoginPayload();
		const request = createLoginRequest(reqPayload);

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
		const request = createLoginRequest({});
		const response = await POST({ request });
		await assertResponse(response, 400, { message: 'Email and password required' });
	});

	it('if email does not match user in database then return 401 error', async () => {
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(null);
		const reqPayload = createLoginPayload();
		const request = createLoginRequest(reqPayload);
		const response = await POST({ request });
		await assertResponse(response, 401, { message: 'Invalid credentials' });
	});

	it('if password does not match user in database then return 401 error', async () => {
		const fakeUser = await createFakeUser();
		vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(fakeUser);

		const reqPayload = createLoginPayload({ password: wrongPassword });
		const request = createLoginRequest(reqPayload);
		const response = await POST({ request });
		await assertResponse(response, 401, { message: 'Invalid credentials' });
	});
});
