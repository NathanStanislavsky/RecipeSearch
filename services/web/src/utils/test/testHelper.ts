import type { RequestEvent, Cookies } from '@sveltejs/kit';
import type { Recipe } from '../../types/recipe.ts';
import { expect, vi } from 'vitest';
import type { JwtPayload } from 'jsonwebtoken';

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

	static createMockCookies(partialCookies: Partial<Cookies> = {}): Cookies {
		return {
			get: vi.fn(),
			set: vi.fn(),
			delete: vi.fn(),
			getAll: vi.fn(),
			serialize: vi.fn(),
			...partialCookies
		};
	}

	static createMockJwtPayload(partialPayload: Partial<JwtPayload> = {}): JwtPayload {
		return {
			iss: 'test',
			sub: 'test',
			aud: 'test',
			exp: Math.floor(Date.now() / 1000) + 3600,
			nbf: Math.floor(Date.now() / 1000),
			iat: Math.floor(Date.now() / 1000),
			jti: 'test',
			...partialPayload
		};
	}

	/**
	 * Creates a mock recipe object with the specified ID
	 * @param id - The recipe ID
	 * @returns A mock Recipe object
	 */
	static createMockRecipe(id: number): Recipe {
		return {
			_id: `recipe_${id}`,
			name: `Test Recipe ${id}`,
			id: id,
			minutes: 30,
			contributor_id: 1,
			submitted: '2023-01-01',
			tags: '["test", "mock"]',
			nutrition: '[200, 10, 5, 300, 20, 3, 25]',
			n_steps: 3,
			steps: '["Step 1", "Step 2", "Step 3"]',
			description: `This is a test recipe ${id} for testing purposes`,
			ingredients: '["ingredient 1", "ingredient 2", "ingredient 3"]',
			n_ingredients: 3,
			score: 4.5
		};
	}

	/**
	 * Creates a mock API response with the specified data and status
	 * @param data - The response data
	 * @param status - The HTTP status code (default: 200)
	 * @returns A Response object
	 */
	static createMockResponse<T>(data: T, status: number = 200): Response {
		return new Response(JSON.stringify(data), {
			status,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	/**
	 * Asserts that a response matches the expected status and data
	 * @param response - The response to assert
	 * @param status - The expected status code
	 * @param expected - The expected response data
	 * @returns The parsed response data
	 */
	static async assertResponse<T>(
		response: Response,
		expectedStatus: number,
		expectedData?: T
	): Promise<void> {
		expect(response.status).toBe(expectedStatus);
		if (expectedData) {
			const data = await response.json();
			expect(data).toEqual(expectedData);
		}
	}

	/**
	 * Creates a test request with the specified URL, method, and body
	 * @param url - The request URL
	 * @param method - The HTTP method
	 * @param body - The request body
	 * @returns A Request object
	 */
	static createTestRequest(url: string, method: string, body: object): Request {
		return new Request(url, {
			method,
			body: JSON.stringify(body)
		});
	}

	/**
	 * Sets up a mock fetch with a single response
	 * @param response - The response to return
	 */
	static setupMockFetch(response: Response): void {
		vi.spyOn(global, 'fetch').mockResolvedValueOnce(response);
	}

	/**
	 * Sets up a mock fetch with multiple responses
	 * @param responses - The responses to return in sequence
	 */
	static setupMockFetchSequence(responses: Response[]): void {
		const spy = vi.spyOn(global, 'fetch');
		responses.forEach((response) => spy.mockResolvedValueOnce(response));
	}
}
