import type { RequestEvent } from '@sveltejs/kit';
import type { Recipe } from '../../types/recipe.ts';
import { expect, vi } from 'vitest';
import { TEST_USER } from './testConstants.js';

export class TestHelper {
	/**
	 * Creates a mock RequestEvent with the specified URL and method
	 * @param url - The URL string to mock
	 * @param options - Additional options for the request event
	 * @returns A mock RequestEvent
	 */
	static createMockRequestEvent(
		url: string,
		options: {
			method?: string;
			user?: { id: number; name: string; email: string } | null;
			cookies?: Record<string, string>;
		} = {}
	): RequestEvent {
		const defaultUser = {
			id: TEST_USER.userId,
			name: TEST_USER.name,
			email: TEST_USER.email
		};

		return {
			request: new Request(url, { method: options.method || 'GET' }),
			url: new URL(url),
			params: {},
			route: { id: 'test' },
			isDataRequest: false,
			fetch: async () => new Response(),
			setHeaders: () => {},
			depends: () => {},
			platform: 'node',
			locals: { user: options.user ?? defaultUser },
			cookies: {
				get: vi.fn((key) => options.cookies?.[key]),
				set: vi.fn(),
				delete: vi.fn(),
				getAll: vi.fn(() =>
					Object.entries(options.cookies || {}).map(([name, value]) => ({ name, value }))
				),
				serialize: vi.fn()
			}
		} as unknown as RequestEvent;
	}

	/**
	 * Creates a mock recipe object with the specified ID
	 * @param id - The recipe ID
	 * @returns A mock Recipe object
	 */
	static createMockRecipe(id: number): Recipe {
		return {
			title: `Test Recipe ${id}`,
			image: `https://example.com/recipe${id}.jpg`,
			servings: 4,
			readyInMinutes: 30,
			sourceUrl: `https://example.com/recipe${id}`
		};
	}

	/**
	 * Creates a mock API response with the specified data and status
	 * @param data - The response data
	 * @param status - The HTTP status code (default: 200)
	 * @param headers - Optional headers to include in the response
	 * @returns A Response object
	 */
	static createMockResponse<T>(
		data: T,
		status: number = 200,
		headers: Record<string, string> = {}
	): Response {
		const defaultHeaders = {
			'Content-Type':
				typeof data === 'string' || data instanceof FormData ? 'text/plain' : 'application/json'
		};
		const finalHeaders = { ...defaultHeaders, ...headers };
		const responseBody = data instanceof FormData ? data : JSON.stringify(data);
		return new Response(responseBody, { status, headers: finalHeaders });
	}

	/**
	 * Asserts that a response matches the expected status and data
	 * @param response - The response to assert
	 * @param status - The expected status code
	 * @param expected - The expected response data
	 * @returns The parsed response data
	 */
	static async assertResponse<T>(
		response: Response | undefined,
		status: number,
		expected: object
	): Promise<T | undefined> {
		expect(response).toBeDefined();
		if (response) {
			expect(response.status).toBe(status);
			const json = await response.json();
			expect(json).toStrictEqual(expected);
			return json;
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
