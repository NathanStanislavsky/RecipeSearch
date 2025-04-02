import bcrypt from 'bcryptjs';
import { getUserByEmail } from '../../queries/user/select.js';
import { createUser } from '../../queries/user/insert.js';
import { createJsonResponse } from '../../utils/api/apiUtils.js';

/**
 * Validates the registration payload data
 * @param payload - The registration data to validate
 * @returns The validated registration data
 * @throws Error if validation fails
 */
const validateRegisterPayload = (
	payload: unknown
): { email: string; password: string; name: string } => {
	if (!payload || typeof payload !== 'object') {
		throw new Error('Invalid request payload');
	}

	const { email, password, name } = payload as { email: string; password: string; name: string };

	if (!email) {
		throw new Error('Email is required');
	}

	if (!password) {
		throw new Error('Password is required');
	}

	if (!name) {
		throw new Error('Name is required');
	}

	if (typeof email !== 'string' || !email.includes('@')) {
		throw new Error('Invalid email format');
	}

	if (typeof password !== 'string' || password.length < 6) {
		throw new Error('Password must be at least 6 characters long');
	}

	if (typeof name !== 'string' || name.trim().length === 0) {
		throw new Error('Name cannot be empty');
	}

	return { email, password, name };
};

export async function POST({ request }: { request: Request }) {
	try {
		// Parse the request body
		const body = await request.json();
		const { email, password, name } = body;

		try {
			validateRegisterPayload({ email, password, name });
		} catch (validationError) {
			console.error('Validation error:', validationError);
			return createJsonResponse(
				{
					success: false,
					message:
						validationError instanceof Error ? validationError.message : 'Invalid request data'
				},
				400
			);
		}

		// Check if a user with the given email already exists
		const existingUser = await getUserByEmail(email);
		if (existingUser) {
			return createJsonResponse({ success: false, message: 'Email already registered' }, 409);
		}

		// Hash the password using bcrypt with 10 salt rounds
		const hashedPassword = await bcrypt.hash(password, 10);

		// Create the new user with the hashed password
		const newUser = await createUser({
			email,
			name,
			password: hashedPassword
		});

		// Return a 201 response with a success message and the new user's id
		return createJsonResponse(
			{
				success: true,
				message: 'User registered successfully',
				userId: newUser.id
			},
			201
		);
	} catch (error) {
		console.error('Registration error:', error);

		if (error instanceof Error && error.message.includes('database')) {
			return createJsonResponse({ success: false, message: 'Database error occurred' }, 500);
		}

		return createJsonResponse({ success: false, message: 'Internal Server Error' }, 500);
	}
}
