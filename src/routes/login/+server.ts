import type { RequestHandler } from './$types';
import { getUserByEmail } from '../../queries/select';
import jwt from 'jsonwebtoken';

const jsonResponse = (data: object, status: number, headers: HeadersInit = {}) =>
	new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...headers
		}
	});

export const POST: RequestHandler = async ({ request }: { request: Request }) => {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return jsonResponse({ message: 'Email and password required' }, 400);
		}

		const user = await getUserByEmail(email);

		if (!user) {
			return jsonResponse({ message: 'Invalid credentials' }, 401);
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
		return jsonResponse({ message: 'login failed' }, 500);
	}
};
