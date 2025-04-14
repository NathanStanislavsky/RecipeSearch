export const createFormDataRequest = (url: string, method: string, formData: FormData) =>
	new Request(url, {
		method,
		body: formData
	});
