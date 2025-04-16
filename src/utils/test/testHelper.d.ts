import type { RequestEvent } from '@sveltejs/kit';
import type { Recipe } from '../../types/recipe.ts';
export declare class TestHelper {
	/**
	 * Creates a mock RequestEvent with the specified URL and method
	 * @param url - The URL string to mock
	 * @param options - Additional options for the request event
	 * @returns A mock RequestEvent
	 */
	static createMockRequestEvent(
		url: string,
		options?: {
			method?: string;
			user?: {
				id: number;
				name: string;
				email: string;
			} | null;
			cookies?: Record<string, string>;
		}
	): RequestEvent;
	/**
	 * Creates a mock recipe object with the specified ID
	 * @param id - The recipe ID
	 * @returns A mock Recipe object
	 */
	static createMockRecipe(id: number): Recipe;
	/**
	 * Creates a mock API response with the specified data and status
	 * @param data - The response data
	 * @param status - The HTTP status code (default: 200)
	 * @param headers - Optional headers to include in the response
	 * @returns A Response object
	 */
	static createMockResponse<T>(
		data: T,
		status?: number,
		headers?: Record<string, string>
	): Response;
	/**
	 * Asserts that a response matches the expected status and data
	 * @param response - The response to assert
	 * @param status - The expected status code
	 * @param expected - The expected response data
	 * @returns The parsed response data
	 */
	static assertResponse<T>(
		response: Response | undefined,
		status: number,
		expected: object
	): Promise<T | undefined>;
	/**
	 * Creates a test request with the specified URL, method, and body
	 * @param url - The request URL
	 * @param method - The HTTP method
	 * @param body - The request body
	 * @returns A Request object
	 */
	static createTestRequest(url: string, method: string, body: object): Request;
	/**
	 * Sets up a mock fetch with a single response
	 * @param response - The response to return
	 */
	static setupMockFetch(response: Response): void;
	/**
	 * Sets up a mock fetch with multiple responses
	 * @param responses - The responses to return in sequence
	 */
	static setupMockFetchSequence(responses: Response[]): void;
	static mockWindowLocation(mockLocation?: Partial<Location>): void;
}
