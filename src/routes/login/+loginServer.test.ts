import { describe, it, expect, vi, beforeAll } from 'vitest';
import { POST } from './+server.ts';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as selectModule from '../../queries/select.ts';
import { assertResponse } from '../../../test-utils/mockUtils.ts';

describe('/login endpoint', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('returns valid token if login was successful', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 10);
    const fakeUser = {
      id: 1,
      email: 'test@example.com',
      passwordHash,
    };

    vi.spyOn(selectModule, 'getUserByEmail').mockResolvedValue(fakeUser);

    const reqBody = JSON.stringify({
      email: 'test@example.com',
      password: 'correct-password',
    });

    const request = new Request('http://localhost/login', {
      method: 'POST',
      body: reqBody,
    });

    const response = await POST({ request });
    const expected = { success: true, token: expect.any(String) };

    const data = await assertResponse(response, 200, expected);

    const decodedToken = jwt.verify(data.token, process.env.JWT_SECRET);
    expect(decodedToken).toMatchObject({
      userId: fakeUser.id,
      email: fakeUser.email,
    });
  });
});