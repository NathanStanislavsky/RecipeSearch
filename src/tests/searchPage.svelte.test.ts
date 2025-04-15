import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte';
import Page from '../routes/search/+page.svelte';

// Helper: Sets up the search form and returns key elements
function setupSearchForm() {
	render(Page);
	const input = screen.getByRole('textbox');
	const button = screen.getByRole('button', { name: /search/i });
	return { input, button };
}

// Helper: Performs a search with given ingredients
async function performSearch(input: HTMLElement, button: HTMLElement, ingredients: string) {
	await fireEvent.input(input, { target: { value: ingredients } });
	await fireEvent.click(button);
}

describe('Page Integration Tests', () => {
	let fetchSpy: MockInstance<(input: RequestInfo, init?: RequestInit) => Promise<Response>>;

	beforeEach(() => {
		fetchSpy = vi.spyOn(global, 'fetch');
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		cleanup();
	});

	it('calls search when ingredients are provided', async () => {
		fetchSpy.mockResolvedValueOnce({
			json: vi.fn().mockResolvedValueOnce([{ title: 'Recipe 1' }, { title: 'Recipe 2' }])
		} as unknown as Response);

		const { input, button } = setupSearchForm();
		await performSearch(input, button, 'chicken');

		expect(fetchSpy).toHaveBeenCalledWith('/search?ingredients=chicken');
	});

	it('does not call fetch when no ingredients are provided', async () => {
		fetchSpy.mockClear();

		const { button } = setupSearchForm();
		await fireEvent.click(button);

		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('displays loading state while fetching', async () => {
		fetchSpy.mockImplementation(() => new Promise(() => {}));

		const { input, button } = setupSearchForm();
		await performSearch(input, button, 'chicken');

		expect(screen.getByText('Loading...')).toBeInTheDocument();
	});

	it.each([
		{ errorMessage: 'API Error', expectedText: 'No results' },
		{ errorMessage: 'Network error', expectedText: 'No results' }
	])('handles error scenario: %s', async ({ errorMessage, expectedText }) => {
		fetchSpy.mockRejectedValueOnce(new Error(errorMessage));
		const { input, button } = setupSearchForm();
		await performSearch(input, button, 'chicken');

		await waitFor(() => {
			expect(screen.getByText(expectedText)).toBeInTheDocument();
		});
	});

	it('displays search results correctly', async () => {
		const mockRecipes = [
			{ title: 'Chicken Soup', readyInMinutes: 30, servings: 4 },
			{ title: 'Grilled Chicken', readyInMinutes: 45, servings: 2 }
		];

		fetchSpy.mockResolvedValueOnce({
			json: vi.fn().mockResolvedValueOnce(mockRecipes)
		} as unknown as Response);

		const { input, button } = setupSearchForm();
		await performSearch(input, button, 'chicken');

		await waitFor(() => {
			expect(screen.getByText('Chicken Soup')).toBeInTheDocument();
			expect(screen.getByText('Grilled Chicken')).toBeInTheDocument();
		});
	});

	it('handles empty search results', async () => {
		fetchSpy.mockResolvedValueOnce({
			json: vi.fn().mockResolvedValueOnce([])
		} as unknown as Response);

		const { input, button } = setupSearchForm();
		await performSearch(input, button, 'chicken');

		await waitFor(() => {
			expect(screen.getByText('No results')).toBeInTheDocument();
		});
	});

	it('handles multiple ingredients correctly', async () => {
		fetchSpy.mockResolvedValueOnce({
			json: vi.fn().mockResolvedValueOnce([{ title: 'Recipe 1' }])
		} as unknown as Response);

		const { input, button } = setupSearchForm();
		await performSearch(input, button, 'chicken, rice, vegetables');

		expect(fetchSpy).toHaveBeenCalledWith('/search?ingredients=chicken, rice, vegetables');
	});
});
