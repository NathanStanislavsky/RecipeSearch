export const jsonResponse = (data: unknown, status = 200, headers: HeadersInit = {}) =>
	new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...headers }
	});
