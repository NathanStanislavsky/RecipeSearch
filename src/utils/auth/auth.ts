import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';
import type { UserPayload } from '../../types/user.ts';

/**
 * Custom error class for JWT verification failures
 */
class JWTVerificationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'JWTVerificationError';
	}
}

/**
 * Verifies and decodes a JWT token
 * @param token - The JWT token to verify
 * @returns The decoded user payload
 * @throws JWTVerificationError if token verification fails
 */
export function verifyToken(token: string): UserPayload {
	try {
		const decoded = jwt.verify(token, JWT_SECRET);

		if (typeof decoded !== 'object' || decoded === null) {
			throw new JWTVerificationError('Invalid token payload format');
		}

		// Handle different token formats
		if ('payload' in decoded) {
			const payload = (decoded as { payload: UserPayload }).payload;
			if (!isValidUserPayload(payload)) {
				throw new JWTVerificationError('Invalid user payload structure');
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
			if (!isValidUserPayload(payload)) {
				throw new JWTVerificationError('Invalid user payload structure');
			}
			return payload;
		}

		// Handle direct user payload format
		const userPayload = decoded as UserPayload;
		if (!isValidUserPayload(userPayload)) {
			throw new JWTVerificationError('Invalid user payload structure');
		}
		return userPayload;
	} catch (error) {
		if (error instanceof jwt.JsonWebTokenError) {
			throw new JWTVerificationError(`JWT verification failed: ${error.message}`);
		}
		if (error instanceof JWTVerificationError) {
			throw error;
		}
		throw new JWTVerificationError('Unknown error during token verification');
	}
}

/**
 * Validates if an object matches the UserPayload interface
 */
export function isValidUserPayload(payload: unknown): payload is UserPayload {
	return (
		typeof payload === 'object' &&
		payload !== null &&
		typeof (payload as UserPayload).id === 'number' &&
		typeof (payload as UserPayload).email === 'string' &&
		typeof (payload as UserPayload).name === 'string'
	);
}
