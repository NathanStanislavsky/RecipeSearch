import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { JWTPayload } from '../../types/user.ts';
import type { User } from '../../types/user.ts';

export class AuthService {
	private static instance: AuthService;
	private jwtSecret: string;

	private constructor() {
		const secret = process.env.JWT_SECRET;
		if (!secret) {
			throw new Error('JWT_SECRET environment variable is not set');
		}
		this.jwtSecret = secret;
	}

	public static getInstance(): AuthService {
		if (!AuthService.instance) {
			AuthService.instance = new AuthService();
		}
		return AuthService.instance;
	}

	public async validateCredentials(user: User | null, password: string): Promise<boolean> {
		if (!user) return false;
		return bcrypt.compare(password, user.password);
	}

	public createJwtToken(user: User): string {
		const payload: JWTPayload = {
			userId: user.id,
			email: user.email
		};
		return jwt.sign(payload, this.jwtSecret, { expiresIn: '1h' });
	}
}
