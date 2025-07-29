/**
 * Base error class for the application
 */
export class AppError extends Error {
	constructor(
		message: string,
		public status: number = 500,
		public code: string = 'INTERNAL_SERVER_ERROR'
	) {
		super(message);
		this.name = 'AppError';
		// Ensure proper prototype chain for instanceof checks
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

/**
 * Error for validation failures
 */
export class ValidationError extends AppError {
	constructor(message: string) {
		super(message, 400, 'VALIDATION_ERROR');
		this.name = 'ValidationError';
	}
}

/**
 * Error for authentication failures
 */
export class AuthError extends AppError {
	constructor(message: string) {
		super(message, 401, 'AUTHENTICATION_ERROR');
		this.name = 'AuthError';
	}
}

/**
 * Error for API-related issues
 */
export class ApiError extends AppError {
	constructor(message: string, status: number = 500) {
		super(message, status, 'API_ERROR');
		this.name = 'ApiError';
	}
}

/**
 * Error for not found resources
 */
export class NotFoundError extends AppError {
	constructor(message: string) {
		super(message, 404, 'NOT_FOUND');
		this.name = 'NotFoundError';
	}
}

/**
 * Error for configuration/environment issues
 */
export class ConfigError extends AppError {
	constructor(message: string) {
		super(message, 500, 'CONFIGURATION_ERROR');
		this.name = 'ConfigError';
	}
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
 * Creates a standardized error response
 */
export function createErrorResponse(error: AppError): ErrorResponse {
	return {
		error: error.name,
		message: error.message,
		code: error.code,
		status: error.status
	};
}

/**
 * Logs errors in a standardized way
 */
export function logError(error: unknown, context: string): void {
	if (error instanceof AppError) {
		console.error(`[${error.name}] ${context}:`, {
			message: error.message,
			code: error.code,
			status: error.status
		});
	} else if (error instanceof Error) {
		console.error(`[Error] ${context}:`, {
			name: error.name,
			message: error.message,
			stack: error.stack
		});
	} else {
		console.error(`[Unknown Error] ${context}:`, error);
	}
}

/**
 * Converts any error to an AppError
 */
export function toAppError(
	error: unknown,
	defaultMessage = 'An unexpected error occurred'
): AppError {
	if (error instanceof AppError) {
		return error;
	}

	if (error instanceof Error) {
		return new AppError(error.message);
	}

	return new AppError(defaultMessage);
}

/**
 * Creates a standardized error response from any error
 */
export function handleError(error: unknown, context: string): ErrorResponse {
	const appError = toAppError(error);
	logError(appError, context);
	return createErrorResponse(appError);
}
