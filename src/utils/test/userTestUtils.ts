import bcrypt from 'bcryptjs';
import type { User } from '../../types/user.ts';
import { TEST_USER } from './testConstants.js';

export async function createFakeUser(password = TEST_USER.correctPassword): Promise<User> {
	const passwordHash = await bcrypt.hash(password, 10);
	return {
		id: TEST_USER.userId,
		email: TEST_USER.email,
		password: passwordHash,
		name: TEST_USER.name
	};
}
