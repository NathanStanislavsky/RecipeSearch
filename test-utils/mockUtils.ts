import { expect, vi} from 'vitest';

export function createMockResponse(
	body: unknown,
	status: number,
	headers = { 'Content-Type': 'application/json' }
): Response {
	return new Response(JSON.stringify(body), { status, headers });
}

export async function assertResponse(
	response: Response | undefined,
	status: number,
	expected: object
) {
	expect(response).toBeDefined();
	if (response) {
		expect(response.status).toBe(status);
		const json = await response.json();
		expect(json).toStrictEqual(expected);
	}
}

export function mockRequestEvent(urlString: string): any {
	return {
		url: new URL(urlString),
		fetch: global.fetch,
		params: {},
		request: new Request(urlString),
		locals: {},
		cookies: {
			get: vi.fn(),
			set: vi.fn(),
			delete: vi.fn()
		},
		platform: undefined
	};
}