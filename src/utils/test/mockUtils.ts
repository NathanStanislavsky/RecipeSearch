import { expect, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

export function createMockResponse(
	body: unknown,
	status: number,
	headers = { 'Content-Type': 'application/json' }
): Response {
	return new Response(JSON.stringify(body), { status, headers });
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

export function mockRequestEvent(urlString: string): RequestEvent {
	return {
		url: new URL(urlString),
		fetch: global.fetch,
		params: {},
		request: new Request(urlString),
		locals: { user: { id: 0, name: '', email: '' } },
		cookies: {
			get: vi.fn(),
			set: vi.fn(),
			delete: vi.fn(),
			getAll: vi.fn(),
			serialize: vi.fn()
		},
		platform: 'node'
	} as unknown as RequestEvent;
}
