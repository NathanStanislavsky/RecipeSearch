import type { RequestEvent, Cookies } from '@sveltejs/kit';

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

export declare class TestHelper {
	/**
	 * Creates a mock RequestEvent with the specified URL and method
	 * @param url - The URL string to mock
	 * @param options - Additional options for the request event
	 * @returns A mock RequestEvent
	 */
	static createMockRequestEvent(
		url?: string,
		options?: MockRequestEventOptions
	): RequestEvent;
}
