import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
 * Service handling all authentication-related operations
 */
export class AuthService {
	private jwtSecret: string;

	constructor(jwtSecret: string) {
		if (!jwtSecret) {
			throw new AuthError('JWT secret is required');
		}
		this.jwtSecret = jwtSecret;
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

			// Type guard for payload format
			if (this.isPayloadFormat(decoded)) {
				if (!this.isValidUserPayload((decoded as { payload: unknown }).payload)) {
					throw new AuthError('Invalid user payload structure');
				}
				return (decoded as { payload: UserPayload }).payload;
			}

			// Type guard for login token format
			if (this.isLoginTokenFormat(decoded)) {
				const payload: UserPayload = {
					id: decoded.userId,
					email: decoded.email,
					name: decoded.name || 'User'
				};
				if (!this.isValidUserPayload(payload)) {
					throw new AuthError('Invalid user payload structure');
				}
				return payload;
			}

			// Type guard for direct user payload
			if (this.isValidUserPayload(decoded)) {
				return decoded;
			}

			throw new AuthError('Invalid token payload format');
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
	 * Type guard for payload format
	 */
	private isPayloadFormat(decoded: object): decoded is { payload: UserPayload } {
		return (
			'payload' in decoded && this.isValidUserPayload((decoded as { payload: unknown }).payload)
		);
	}

	/**
	 * Type guard for login token format
	 */
	private isLoginTokenFormat(
		decoded: object
	): decoded is { userId: number; email: string; name?: string } {
		return (
			'userId' in decoded &&
			'email' in decoded &&
			typeof (decoded as { userId: unknown }).userId === 'number' &&
			typeof (decoded as { email: unknown }).email === 'string'
		);
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

	public validateLoginForm = (email: string, password: string) => {
		if (!email || !password) {
			return {
				isValid: false,
				message: 'Email and password required'
			};
		}
		return { isValid: true };
	};
}
