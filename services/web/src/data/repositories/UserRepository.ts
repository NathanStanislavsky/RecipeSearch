import { eq } from 'drizzle-orm';
import { postgres } from '../connections/index.js';
import { users } from '../database/schema.ts';
import type { User, CreateUserData } from '../models/User.js';

export class UserRepository {
	/**
	 * Find a user by email address
	 */
	async findByEmail(email: string): Promise<User | null> {
		const result = await postgres.select().from(users).where(eq(users.email, email));
		return result.length > 0 ? result[0] : null;
	}

	/**
	 * Find a user by ID
	 */
	async findById(id: number): Promise<User | null> {
		const result = await postgres.select().from(users).where(eq(users.id, id));
		return result.length > 0 ? result[0] : null;
	}

	/**
	 * Create a new user
	 */
	async create(userData: CreateUserData): Promise<User> {
		const result = await postgres.insert(users).values(userData).returning();
		return result[0];
	}

	/**
	 * Update user password
	 */
	async updatePassword(userId: number, hashedPassword: string): Promise<void> {
		await postgres.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
	}

	/**
	 * Update user profile information
	 */
	async updateProfile(userId: number, updates: { name?: string; email?: string }): Promise<User> {
		const result = await postgres
			.update(users)
			.set(updates)
			.where(eq(users.id, userId))
			.returning();
		return result[0];
	}

	/**
	 * Delete a user by ID
	 */
	async deleteById(userId: number): Promise<void> {
		await postgres.delete(users).where(eq(users.id, userId));
	}

	/**
	 * Check if a user exists by email
	 */
	async existsByEmail(email: string): Promise<boolean> {
		const result = await postgres
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, email))
			.limit(1);
		return result.length > 0;
	}
}
