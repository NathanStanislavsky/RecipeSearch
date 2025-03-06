import bcrypt from 'bcryptjs';
import { getUserByEmail } from '../../queries/select';
import { createUser } from '../../queries/insert';

export async function POST({ request }) {
	// Parse the request body
	const { email, password, name } = await request.json();

	// Hash the password using bcrypt with 10 salt rounds.
	const hashedPassword = await bcrypt.hash(password, 10);

	// Create the new user with the hashed password.
	// The createUser function is expected to return the created user.
	const newUser = await createUser({
		email,
		name,
		password: hashedPassword
	});

	// Return a 201 response with a success message and the new user's id.
	return new Response(
		JSON.stringify({
			message: 'User registered successfully',
			userId: newUser.id
		}),
		{ status: 201 }
	);
}
