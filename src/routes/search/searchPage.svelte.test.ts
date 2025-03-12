import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Page from './+page.svelte'

describe('/+page.svelte Rendering', () => {
	it('renders the h1 with correct text', () => {
		render(Page);
		const heading = screen.getByRole('heading', { level: 1 });
		expect(heading).toBeInTheDocument();
		expect(heading).toHaveTextContent('What is in your fridge?');
	});
});

describe('Page Integration Tests', () => {
	let fetchSpy: MockInstance<(input: RequestInfo, init?: RequestInit) => Promise<Response>>;

	beforeEach(() => {
		fetchSpy = vi.spyOn(global, 'fetch');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('calls searchRecipes when ingredients are provided', async () => {
		fetchSpy.mockResolvedValueOnce({
			json: vi.fn().mockResolvedValueOnce({ success: true, data: ['recipe1', 'recipe2'] })
		} as unknown as Response);

		render(Page);

		const input = screen.getByRole('textbox');
		const button = screen.getByRole('button', { name: /search/i });

		await fireEvent.input(input, { target: { value: 'chicken' } });
		await fireEvent.click(button);

		expect(fetchSpy).toHaveBeenCalledWith('/searchRecipes?ingredients=chicken');
	});

	it('does not call fetch when no ingredients are provided', async () => {
		fetchSpy.mockClear();

		render(Page);

		const button = screen.getByRole('button', { name: /search/i });
		await fireEvent.click(button);

		expect(fetchSpy).not.toHaveBeenCalled();
	});
});
