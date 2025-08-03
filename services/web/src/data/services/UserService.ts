import { UserRepository } from '../repositories/UserRepository.js';
import type { User, CreateUserData, UserPayload } from '../models/User.js';
import bcrypt from 'bcryptjs';
import { ValidationError } from '$utils/errors/AppError.js';

export class UserService {
	constructor(private userRepo = new UserRepository()) {}

	/**
	 * Register a new user
	 */
	async registerUser(userData: CreateUserData): Promise<User> {
		// Validate input
		this.validateRegistrationData(userData);

		// Check if user already exists
		const existingUser = await this.userRepo.findByEmail(userData.email);
		if (existingUser) {
			throw new ValidationError('Email already registered');
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(userData.password, 10);

		// Create user
		const user = await this.userRepo.create({
			...userData,
			password: hashedPassword
		});

		return user;
	}

	/**
	 * Authenticate user login
	 */
	async authenticateUser(email: string, password: string): Promise<User | null> {
		// Validate input
		if (!email || !password) {
			throw new ValidationError('Email and password are required');
		}

		// Find user
		const user = await this.userRepo.findByEmail(email);
		if (!user) {
			return null; // User not found
		}

		// Verify password
		const isValidPassword = await bcrypt.compare(password, user.password!);
		if (!isValidPassword) {
			return null; // Invalid password
		}

		return user;
	}

	/**
	 * Get user by ID
	 */
	async getUserById(id: number): Promise<User | null> {
		const user = await this.userRepo.findById(id);
		if (!user) return null;

		return user;
	}

	/**
	 * Get user by email
	 */
	async getUserByEmail(email: string): Promise<User | null> {
		const user = await this.userRepo.findByEmail(email);
		if (!user) return null;

		return user;
	}

	/**
	 * Update user profile
	 */
	async updateUserProfile(
		userId: number,
		updates: { name?: string; email?: string }
	): Promise<User> {
		// Validate updates
		if (updates.email) {
			const existingUser = await this.userRepo.findByEmail(updates.email);
			if (existingUser && existingUser.id !== userId) {
				throw new ValidationError('Email already in use by another user');
			}
		}

		const user = await this.userRepo.updateProfile(userId, updates);

		return user;
	}

	/**
	 * Change user password
	 */
	async changePassword(
		userId: number,
		currentPassword: string,
		newPassword: string
	): Promise<void> {
		// Get current user
		const user = await this.userRepo.findById(userId);
		if (!user) {
			throw new ValidationError('User not found');
		}

		// Verify current password
		const isValidPassword = await bcrypt.compare(currentPassword, user.password!);
		if (!isValidPassword) {
			throw new ValidationError('Current password is incorrect');
		}

		// Validate new password
		this.validatePassword(newPassword);

		// Hash new password
		const hashedPassword = await bcrypt.hash(newPassword, 10);

		// Update password
		await this.userRepo.updatePassword(userId, hashedPassword);
	}

	/**
	 * Create user payload for JWT
	 */
	createUserPayload(user: User): UserPayload {
		return {
			id: user.id,
			email: user.email,
			name: user.name
		};
	}

	/**
	 * Validate registration data
	 */
	private validateRegistrationData(data: CreateUserData): void {
		if (!data.name || data.name.trim().length < 2) {
			throw new ValidationError('Name must be at least 2 characters long');
		}

		if (!data.email || !this.isValidEmail(data.email)) {
			throw new ValidationError('Please provide a valid email address');
		}

		this.validatePassword(data.password);
	}

	/**
	 * Validate password
	 */
	private validatePassword(password: string): void {
		if (!password || password.length < 6) {
			throw new ValidationError('Password must be at least 6 characters long');
		}
	}

	/**
	 * Validate email format
	 */
	private isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}
}
