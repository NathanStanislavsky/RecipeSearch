import type { RequestHandler } from './$types';
import { getUserByEmail } from '../../queries/user/select';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createJsonResponse } from '../../utils/api/apiUtils';

export const POST: RequestHandler = async ({ request }: { request: Request }) => {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return createJsonResponse({ message: 'Email and password required' }, 400);
		}

		const user = await getUserByEmail(email);

		if (!user) {
			return createJsonResponse({ message: 'Invalid credentials' }, 401);
		}

		const passwordMatches = await bcrypt.compare(password, user.password);

		if (!passwordMatches) {
			return createJsonResponse({ message: 'Invalid credentials' }, 401);
		}

		const token = jwt.sign(
			{
				userId: user.id,
				email: user.email
			},
			process.env.JWT_SECRET,
			{
				expiresIn: '1h'
			}
		);

		return new Response(JSON.stringify({ success: true, token }), {
			status: 200,
			headers: {
				'Set-Cookie': `jwt=${token}; HttpOnly; Path=/; Max-Age=3600; Secure`
			}
		});
	} catch (error) {
		console.error(error);
		return createJsonResponse({ message: 'login failed' }, 500);
	}
};
