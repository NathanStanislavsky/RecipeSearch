import type { Actions } from './$types.js';
import { getUserByEmail } from '../../queries/user/select.js';
import bcrypt from 'bcryptjs';
import { createUser } from '../../queries/user/insert.js';
import { type RequestEvent } from '@sveltejs/kit';
import { ValidationError, handleError } from '../../utils/errors/AppError.js';

export const actions: Actions = {
	default: async ({ request }: RequestEvent) => {
		try {
			const formData = await request.formData();
			const email = formData.get('email')?.toString() || '';
			const password = formData.get('password')?.toString() || '';
			const name = formData.get('name')?.toString() || '';

			try {
				validateRegisterPayload({ email, password, name });
			} catch (error) {
				if (error instanceof ValidationError) {
					return { success: false, message: error.message };
				}
				throw error;
			}

			const existingUser = await getUserByEmail(email);
			if (existingUser) {
				return { success: false, message: 'Email already registered' };
			}

			const hashedPassword = await bcrypt.hash(password, 10);
			const newUser = await createUser({
				email,
				name,
				password: hashedPassword
			});

			return {
				success: true,
				message: 'User registered successfully',
				userId: newUser.id
			};
		} catch (error) {
			const errorResponse = handleError(error, 'Registration');
			return { success: false, message: errorResponse.message };
		}
	}
};

/**
 * Validates the registration payload data
 * @param payload - The registration data to validate
 * @returns The validated registration data
 * @throws ValidationError if validation fails
 */
const validateRegisterPayload = (
	payload: unknown
): { email: string; password: string; name: string } => {
	if (!payload || typeof payload !== 'object') {
		throw new ValidationError('Invalid request payload');
	}

	const { email, password, name } = payload as { email: string; password: string; name: string };

	if (!email) {
		throw new ValidationError('Email is required');
	}

	if (!password) {
		throw new ValidationError('Password is required');
	}

	if (!name) {
		throw new ValidationError('Name is required');
	}

	if (typeof email !== 'string' || !email.includes('@')) {
		throw new ValidationError('Invalid email format');
	}

	if (typeof password !== 'string' || password.length < 6) {
		throw new ValidationError('Password must be at least 6 characters long');
	}

	if (typeof name !== 'string' || name.trim().length === 0) {
		throw new ValidationError('Name cannot be empty');
	}

	return { email, password, name };
};
