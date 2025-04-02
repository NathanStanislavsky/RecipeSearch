import type { RequestHandler } from './$types.js';
import { getUserByEmail } from '../../queries/user/select.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createJsonResponse } from '../../utils/api/apiUtils.js';
import type { LoginPayload, JWTPayload } from '../../types/user.ts';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Parse and validate the request body
		const body = await request.json();
		const { email, password } = validateLoginRequest(body);

		const user = await getUserByEmail(email);

		if (!user) {
			return createJsonResponse({ success: false, message: 'Invalid credentials' }, 401);
		}

		const passwordMatches = await bcrypt.compare(password, user.password);

		if (!passwordMatches) {
			return createJsonResponse({ success: false, message: 'Invalid credentials' }, 401);
		}

		const payload: JWTPayload = {
			userId: user.id,
			email: user.email
		};

		const jwtSecret = process.env.JWT_SECRET;
		if (!jwtSecret) {
			throw new Error('JWT_SECRET environment variable is not set');
		}

		const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

		return createJsonResponse({ success: true, token }, 200, {
			'Set-Cookie': `jwt=${token}; HttpOnly; Path=/; Max-Age=3600; Secure`
		});
	} catch (error) {
		console.error(error);

		if (error instanceof Error && error.message === 'Email and password required') {
			return createJsonResponse({ success: false, message: error.message }, 400);
		}

		return createJsonResponse({ success: false, message: 'login failed' }, 500);
	}
};

function validateLoginRequest(body: unknown): LoginPayload {
	if (!body || typeof body !== 'object') {
		throw new Error('Invalid request body');
	}

	const { email, password } = body as LoginPayload;
	if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
		throw new Error('Email and password required');
	}

	return { email, password };
}
