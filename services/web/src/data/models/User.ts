// Base User interface
export interface User {
	id: number;
	name: string;
	email: string;
	password?: string;
}

// User creation data (for registration)
export interface CreateUserData {
	name: string;
	email: string;
	password: string;
}

// User update data (for profile updates)
export interface UpdateUserData {
	name?: string;
	email?: string;
}

// User payload for JWT tokens
export interface UserPayload {
	id: number;
	email: string;
	name: string;
}

// JWT payload structure
export interface JWTPayload {
	user: UserPayload;
	iat?: number;
	exp?: number;
}

// Registration form data
export interface RegisterPayload {
	name: string;
	email: string;
	password: string;
}

// Login form data
export interface LoginPayload {
	email: string;
	password: string;
}
