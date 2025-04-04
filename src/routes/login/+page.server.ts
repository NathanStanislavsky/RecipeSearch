import type { Actions } from './$types.js';
import { getUserByEmail } from '../../queries/user/select.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { JWTPayload } from '../../types/user.ts';
import type { RequestEvent } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request, cookies }: RequestEvent) => {
		try {
			// Get form data
			const formData = await request.formData();
			const email = formData.get('email')?.toString() || '';
			const password = formData.get('password')?.toString() || '';

			// Validate input
			if (!email || !password) {
				return { success: false, message: 'Email and password required' };
			}

			// Look up the user by email
			const user = await getUserByEmail(email);
			if (!user) {
				return { success: false, message: 'Invalid credentials' };
			}

			// Compare the password with the stored hash
			const passwordMatches = await bcrypt.compare(password, user.password);
			if (!passwordMatches) {
				return { success: false, message: 'Invalid credentials' };
			}

			// Create the JWT payload and token
			const payload: JWTPayload = {
				userId: user.id,
				email: user.email
			};

			const jwtSecret = process.env.JWT_SECRET;
			if (!jwtSecret) {
				throw new Error('JWT_SECRET environment variable is not set');
			}

			const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

			// Set the JWT cookie
			cookies.set('jwt', token, {
				httpOnly: true,
				path: '/',
				maxAge: 3600,
				secure: true
			});
		} catch (error) {
			console.error(error);
			return { success: false, message: 'Login failed' };
		}
	}
};
