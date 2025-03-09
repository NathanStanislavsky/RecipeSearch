export const createTestRequest = (url: string, method: string, body: object) =>
	new Request(url, {
		method,
		body: JSON.stringify(body)
	});
