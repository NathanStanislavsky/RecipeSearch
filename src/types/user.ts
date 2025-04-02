export interface User {
	id: number;
	email: string;
	password: string;
	name: string;
}

export interface UserPayload {
	id: number;
	email: string;
	name: string;
}

export interface LoginPayload {
	email: string;
	password: string;
}

export interface RegisterPayload {
	email: string;
	password: string;
	name: string;
}

export interface JWTPayload {
	userId: number;
	email: string;
}
