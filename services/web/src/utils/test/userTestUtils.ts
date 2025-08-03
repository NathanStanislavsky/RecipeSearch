import bcrypt from 'bcryptjs';
import type { User } from '../../types/user.js';

export const TEST_USER = {
	email: 'test@example.com',
	correctPassword: 'correct-password',
	wrongPassword: 'wrong-password',
	name: 'Test User',
	userId: 1
} as const;

export async function createFakeUser(password = TEST_USER.correctPassword): Promise<User> {
	const passwordHash = await bcrypt.hash(password, 10);
	return {
		id: TEST_USER.userId,
		email: TEST_USER.email,
		password: passwordHash,
		name: TEST_USER.name
	};
}
