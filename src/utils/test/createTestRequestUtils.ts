export const createTestRequest = (url: string, method: string, body: object) =>
	new Request(url, {
		method,
		body: JSON.stringify(body)
	});

export const createFormDataRequest = (url: string, method: string, formData: FormData) =>
	new Request(url, {
		method,
		body: formData
	});
