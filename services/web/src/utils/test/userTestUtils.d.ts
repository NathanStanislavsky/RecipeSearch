import type { User } from '../../types/user.js';

export declare const TEST_USER: {
	readonly email: 'test@example.com';
	readonly correctPassword: 'correct-password';
	readonly wrongPassword: 'wrong-password';
	readonly name: 'Test User';
	readonly userId: 1;
};

export declare function createFakeUser(password?: string): Promise<User>;
