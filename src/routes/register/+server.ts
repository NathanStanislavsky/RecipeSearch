import bcrypt from 'bcryptjs';
import { getUserByEmail } from '../../queries/select.ts';
import { createUser } from '../../queries/insert.ts';

// Helper to create a JSON response with a given status
const jsonResponse = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status });

export async function POST({ request }) {
    try {
        // Parse the request body
        const { email, password, name } = await request.json();

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

