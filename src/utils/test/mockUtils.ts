import { expect, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { TEST_USER } from './testConstants.js';

export function createMockResponse(
	body: unknown,
	status: number,
	headers: Record<string, string> = {}
): Response {
	const defaultHeaders = {
		'Content-Type':
			typeof body === 'string' || body instanceof FormData ? 'text/plain' : 'application/json'
	};
	const finalHeaders = { ...defaultHeaders, ...headers };
	const responseBody = body instanceof FormData ? body : JSON.stringify(body);
	return new Response(responseBody, { status, headers: finalHeaders });
}

export async function assertResponse<T>(
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

export function mockRequestEvent(
	urlString: string,
	options: {
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
		url: new URL(urlString),
		fetch: global.fetch,
		params: {},
		request: new Request(urlString),
		locals: { user: options.user ?? defaultUser },
		cookies: {
			get: vi.fn((key) => options.cookies?.[key]),
			set: vi.fn(),
			delete: vi.fn(),
			getAll: vi.fn(() =>
				Object.entries(options.cookies || {}).map(([name, value]) => ({ name, value }))
			),
			serialize: vi.fn()
		},
		platform: 'node'
	} as unknown as RequestEvent;
}
