import type { RequestEvent, Cookies } from '@sveltejs/kit';
import { vi } from 'vitest';

interface User {
	id: number;
	name: string;
	email: string;
}

interface MockRequestEventOptions {
	url?: string;
	cookies?: Partial<Cookies>;
	locals?: {
		user: User;
		[key: string]: unknown;
	};
}

export class TestHelper {
	/**
	 * Creates a mock RequestEvent with the specified URL and method
	 * @param url - The URL string to mock
	 * @param options - Additional options for the request event
	 * @returns A mock RequestEvent
	 */
	static createMockRequestEvent(
		url: string = 'http://localhost:3000',
		options: MockRequestEventOptions = {}
	): RequestEvent {
		const defaultUser: User = {
			id: 1,
			name: 'Test User',
			email: 'test@example.com'
		};

		return {
			request: new Request(url),
			url: new URL(url),
			params: {},
			route: { id: null },
			cookies: this.createMockCookies(options.cookies),
			locals: {
				user: options.locals?.user || defaultUser,
				...options.locals
			},
			platform: undefined,
			fetch: global.fetch,
			setHeaders: vi.fn(),
			getClientAddress: vi.fn().mockReturnValue('127.0.0.1'),
			isDataRequest: false,
			isSubRequest: false
		};
	}

	private static createMockCookies(partialCookies: Partial<Cookies> = {}): Cookies {
		return {
			get: vi.fn(),
			set: vi.fn(),
			delete: vi.fn(),
			getAll: vi.fn(),
			serialize: vi.fn(),
			...partialCookies
		};
	}
}
