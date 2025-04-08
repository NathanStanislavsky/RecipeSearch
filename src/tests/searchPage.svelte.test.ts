import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Page from '../routes/search/+page.svelte';

describe('Page Integration Tests', () => {
	let fetchSpy: MockInstance<(input: RequestInfo, init?: RequestInit) => Promise<Response>>;

	beforeEach(() => {
		fetchSpy = vi.spyOn(global, 'fetch');
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('calls search when ingredients are provided', async () => {
		fetchSpy.mockResolvedValueOnce({
			json: vi.fn().mockResolvedValueOnce({ success: true, data: ['recipe1', 'recipe2'] })
		} as unknown as Response);

		render(Page);

		const input = screen.getByRole('textbox');
		const button = screen.getByRole('button', { name: /search/i });

		await fireEvent.input(input, { target: { value: 'chicken' } });
		await fireEvent.click(button);

		expect(fetchSpy).toHaveBeenCalledWith('/search?ingredients=chicken');
	});

	it('does not call fetch when no ingredients are provided', async () => {
		fetchSpy.mockClear();

		render(Page);

		const button = screen.getByRole('button', { name: /search/i });
		await fireEvent.click(button);

		expect(fetchSpy).not.toHaveBeenCalled();
	});
});
