import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { JWTPayload, UserPayload, User } from '../../types/user.js';
import type { Cookies } from '@sveltejs/kit';
import { AuthError } from '../errors/AppError.js';

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
		if (!user || !user.password) return false;
		return bcrypt.compare(password, user.password);
	}

	/**
	 * Creates a JWT token for the given user
	 * @param user - The user object
	 * @returns string - The signed JWT token
	 */
	public createJwtToken(user: User): string {
		const payload: JWTPayload = {
			user: {
				id: user.id,
				email: user.email,
				name: user.name
			}
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

			// Check for JWTPayload format
			if (this.isJWTPayloadFormat(decoded)) {
				return decoded.user;
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
	 * Type guard for JWT payload format
	 */
	private isJWTPayloadFormat(decoded: object): decoded is JWTPayload {
		return (
			'user' in decoded &&
			typeof (decoded as JWTPayload).user === 'object' &&
			(decoded as JWTPayload).user !== null &&
			typeof (decoded as JWTPayload).user.id === 'number' &&
			typeof (decoded as JWTPayload).user.email === 'string' &&
			typeof (decoded as JWTPayload).user.name === 'string'
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
