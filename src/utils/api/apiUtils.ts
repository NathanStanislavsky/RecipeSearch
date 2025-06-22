/**
 * Creates a standardized JSON response
 * @param data - The data to include in the response
 * @param status - The HTTP status code
 * @param headers - Additional headers to include
 * @returns A Response object with JSON content
 */
export const createJsonResponse = (
	data: unknown,
	status = 200,
	headers: HeadersInit = {}
): Response => {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...headers }
	});
};
