import bcrypt from 'bcryptjs';
import { getUserByEmail } from '../../queries/user/select.js';
import { createUser } from '../../queries/user/insert.js';
import { createJsonResponse } from '../../utils/api/apiUtils.js';

const validateRegisterPayload = (payload: any) => {
	const { email, password, name } = payload;
	if (!email || !password || !name) {
		throw new Error('Missing required fields');
	}
	return { email, password, name };
};

export async function POST({ request }: { request: Request }) {
	try {
		// Parse the request body
		const { email, password, name } = await request.json();

		validateRegisterPayload({ email, password, name });

		// Check if a user with the given email already exists
		const existingUser = await getUserByEmail(email);
		if (existingUser) {
			return createJsonResponse({ message: 'Email already registered' }, 409);
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
				message: 'User registered successfully',
				userId: newUser.id
			},
			201
		);
	} catch (error) {
		console.error('Registration error:', error);
		return createJsonResponse({ message: 'Internal Server Error' }, 500);
	}
}
