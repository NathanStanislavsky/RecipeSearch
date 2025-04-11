import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';
import type { JWTPayload, UserPayload, User } from '../../types/user.ts';
import type { Cookies } from '@sveltejs/kit';

/**
 * Custom error class for authentication-related errors
 */
class AuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AuthError';
	}
}

/**
 * Singleton service handling all authentication-related operations
 */
export class AuthService {
	private static instance: AuthService;
	private jwtSecret: string;

	private constructor() {
		if (!JWT_SECRET) {
			throw new AuthError('JWT_SECRET environment variable is not set');
		}
		this.jwtSecret = JWT_SECRET;
	}

	/**
	 * Gets the singleton instance of AuthService
	 */
	public static getInstance(): AuthService {
		if (!AuthService.instance) {
			AuthService.instance = new AuthService();
		}
		return AuthService.instance;
	}

	/**
	 * Validates user credentials against stored password hash
	 * @param user - The user object or null if user not found
	 * @param password - The plain text password to validate
	 * @returns Promise<boolean> - True if credentials are valid
	 */
	public async validateCredentials(user: User | null, password: string): Promise<boolean> {
		if (!user) return false;
		return bcrypt.compare(password, user.password);
	}

	/**
	 * Creates a JWT token for the given user
	 * @param user - The user object
	 * @returns string - The signed JWT token
	 */
	public createJwtToken(user: User): string {
		const payload: JWTPayload = {
			userId: user.id,
			email: user.email
		};
		return jwt.sign(payload, this.jwtSecret, { expiresIn: '1h' });
	}

	/**
	 * Verifies and decodes a JWT token
	 * @param token - The JWT token to verify
	 * @returns UserPayload - The decoded user payload
	 * @throws AuthError if token verification fails
	 */
	public verifyToken(token: string): UserPayload {
		try {
			const decoded = jwt.verify(token, this.jwtSecret);

			if (typeof decoded !== 'object' || decoded === null) {
				throw new AuthError('Invalid token payload format');
			}

			// Handle different token formats
			if ('payload' in decoded) {
				const payload = (decoded as { payload: UserPayload }).payload;
				if (!this.isValidUserPayload(payload)) {
					throw new AuthError('Invalid user payload structure');
				}
				return payload;
			}

			// Handle login token format
			if ('userId' in decoded && 'email' in decoded) {
				const payload: UserPayload = {
					id: (decoded as { userId: number }).userId,
					email: (decoded as { email: string }).email,
					name: (decoded as { name: string }).name || 'User'
				};
				if (!this.isValidUserPayload(payload)) {
					throw new AuthError('Invalid user payload structure');
				}
				return payload;
			}

			// Handle direct user payload format
			const userPayload = decoded as UserPayload;
			if (!this.isValidUserPayload(userPayload)) {
				throw new AuthError('Invalid user payload structure');
			}
			return userPayload;
		} catch (error) {
			if (error instanceof jwt.JsonWebTokenError) {
				throw new AuthError(`JWT verification failed: ${error.message}`);
			}
			if (error instanceof AuthError) {
				throw error;
			}
			throw new AuthError('Unknown error during token verification');
		}
	}

	/**
	 * Validates if an object matches the UserPayload interface
	 * @param payload - The object to validate
	 * @returns boolean - True if the object is a valid UserPayload
	 */
	private isValidUserPayload(payload: unknown): payload is UserPayload {
		return (
			typeof payload === 'object' &&
			payload !== null &&
			typeof (payload as UserPayload).id === 'number' &&
			typeof (payload as UserPayload).email === 'string' &&
			typeof (payload as UserPayload).name === 'string'
		);
	}

	/**
	 * Sets the authentication cookie in the response
	 * @param cookies - The cookies object from SvelteKit
	 * @param token - The JWT token to set
	 */
	public setAuthCookie(cookies: Cookies, token: string): void {
		cookies.set('jwt', token, {
			httpOnly: true,
			path: '/',
			maxAge: 3600,
			secure: true
		});
	}
}
