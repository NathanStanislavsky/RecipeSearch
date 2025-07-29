import type { UserPayload, User } from '../../types/user.ts';
import type { Cookies } from '@sveltejs/kit';
/**
 * Service handling all authentication-related operations
 */
export declare class AuthService {
	private jwtSecret;
	constructor(jwtSecret: string);
	/**
	 * Validates user credentials against stored password hash
	 * @param user - The user object or null if user not found
	 * @param password - The plain text password to validate
	 * @returns Promise<boolean> - True if credentials are valid
	 */
	validateCredentials(user: User | null, password: string): Promise<boolean>;
	/**
	 * Creates a JWT token for the given user
	 * @param user - The user object
	 * @returns string - The signed JWT token
	 */
	createJwtToken(user: User): string;
	/**
	 * Verifies and decodes a JWT token
	 * @param token - The JWT token to verify
	 * @returns UserPayload - The decoded user payload
	 * @throws AuthError if token verification fails
	 */
	verifyToken(token: string): UserPayload;
	/**
	 * Type guard for payload format
	 */
	private isPayloadFormat;
	/**
	 * Type guard for login token format
	 */
	private isLoginTokenFormat;
	/**
	 * Validates if an object matches the UserPayload interface
	 * @param payload - The object to validate
	 * @returns boolean - True if the object is a valid UserPayload
	 */
	private isValidUserPayload;
	/**
	 * Sets the authentication cookie in the response
	 * @param cookies - The cookies object from SvelteKit
	 * @param token - The JWT token to set
	 */
	setAuthCookie(cookies: Cookies, token: string): void;
	validateLoginForm: (
		email: string,
		password: string
	) =>
		| {
				isValid: boolean;
				message: string;
		  }
		| {
				isValid: boolean;
				message?: undefined;
		  };
}
