/**
 * Base error class for the application
 */
export declare class AppError extends Error {
	status: number;
	code: string;
	constructor(message: string, status?: number, code?: string);
}

/**
 * Error for validation failures
 */
export declare class ValidationError extends AppError {
	constructor(message: string);
}

/**
 * Error for authentication failures
 */
export declare class AuthError extends AppError {
	constructor(message: string);
}

/**
 * Error for API-related issues
 */
export declare class ApiError extends AppError {
	constructor(message: string, status?: number);
}

/**
 * Error response interface
 */
export interface ErrorResponse {
	error: string;
	message: string;
	code: string;
	status: number;
}

/**
 * Creates a standardized error response from any error
 */
export declare function handleError(error: unknown, context: string): ErrorResponse;
