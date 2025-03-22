import bcrypt from 'bcryptjs';
import { getUserByEmail } from '../../queries/user/select';
import { createUser } from '../../queries/user/insert';
import { jsonResponse } from '../../utils/responseUtil';

const validateRegisterPayload = (payload: any) => {
	const { email, password, name } = payload;
	if (!email || !password || !name) {
		throw new Error('Missing required fields');
	}
	return { email, password, name };
};

export async function POST({ request }) {
	try {
		// Parse the request body
		const { email, password, name } = await request.json();

		validateRegisterPayload({ email, password, name });

		// Check if a user with the given email already exists
		const existingUser = await getUserByEmail(email);
		if (existingUser) {
			return jsonResponse({ message: 'Email already registered' }, 409);
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
		return jsonResponse(
			{
				message: 'User registered successfully',
				userId: newUser.id
			},
			201
		);
	} catch (error) {
		console.error('Registration error:', error);
		return jsonResponse({ message: 'Internal Server Error' }, 500);
	}
}
