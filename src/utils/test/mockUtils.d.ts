import type { RequestEvent } from '@sveltejs/kit';
export declare function createMockResponse(
	body: unknown,
	status: number,
	headers?: {
		'Content-Type': string;
	}
): Response;
export declare function assertResponse<T>(
	response: Response | undefined,
	status: number,
	expected: object
): Promise<T | undefined>;
export declare function mockRequestEvent(urlString: string): RequestEvent;
