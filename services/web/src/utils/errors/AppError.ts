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
export function handleError(error: unknown, context: string): ErrorResponse {
	let appError: AppError;
	
	if (error instanceof AppError) {
		appError = error;
	} else if (error instanceof Error) {
		appError = new AppError(error.message);
	} else {
		appError = new AppError('An unexpected error occurred');
	}

	// Log the error
	console.error(`[${appError.name}] ${context}:`, {
		message: appError.message,
		code: appError.code,
		status: appError.status
	});

	// Return standardized response
	return {
		error: appError.name,
		message: appError.message,
		code: appError.code,
		status: appError.status
	};
}
