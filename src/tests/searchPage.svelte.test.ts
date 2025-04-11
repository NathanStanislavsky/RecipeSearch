import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
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
			json: vi.fn().mockResolvedValueOnce([{ title: 'Recipe 1' }, { title: 'Recipe 2' }])
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

	it('displays loading state while fetching', async () => {
		fetchSpy.mockImplementation(() => new Promise(() => {}));

		render(Page);

		const input = screen.getByRole('textbox');
		const button = screen.getByRole('button', { name: /search/i });

		await fireEvent.input(input, { target: { value: 'chicken' } });
		await fireEvent.click(button);

		expect(screen.getByText('Loading...')).toBeInTheDocument();
	});

	it('handles API errors gracefully', async () => {
		fetchSpy.mockRejectedValueOnce(new Error('API Error'));

		render(Page);

		const input = screen.getByRole('textbox');
		const button = screen.getByRole('button', { name: /search/i });

		await fireEvent.input(input, { target: { value: 'chicken' } });
		await fireEvent.click(button);

		await waitFor(() => {
			expect(screen.getByText('No results')).toBeInTheDocument();
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

		render(Page);

		const input = screen.getByRole('textbox');
		const button = screen.getByRole('button', { name: /search/i });

		await fireEvent.input(input, { target: { value: 'chicken' } });
		await fireEvent.click(button);

		await waitFor(() => {
			expect(screen.getByText('Chicken Soup')).toBeInTheDocument();
			expect(screen.getByText('Grilled Chicken')).toBeInTheDocument();
		});
	});

	it('handles network errors gracefully', async () => {
		fetchSpy.mockRejectedValueOnce(new Error('Network error'));

		render(Page);

		const input = screen.getByRole('textbox');
		const button = screen.getByRole('button', { name: /search/i });

		await fireEvent.input(input, { target: { value: 'chicken' } });
		await fireEvent.click(button);

		await waitFor(() => {
			expect(screen.getByText('No results')).toBeInTheDocument();
		});
	});

	it('handles empty search results', async () => {
		fetchSpy.mockResolvedValueOnce({
			json: vi.fn().mockResolvedValueOnce([])
		} as unknown as Response);

		render(Page);

		const input = screen.getByRole('textbox');
		const button = screen.getByRole('button', { name: /search/i });

		await fireEvent.input(input, { target: { value: 'chicken' } });
		await fireEvent.click(button);

		await waitFor(() => {
			expect(screen.getByText('No results')).toBeInTheDocument();
		});
	});

	it('handles multiple ingredients correctly', async () => {
		fetchSpy.mockResolvedValueOnce({
			json: vi.fn().mockResolvedValueOnce([{ title: 'Recipe 1' }])
		} as unknown as Response);

		render(Page);

		const input = screen.getByRole('textbox');
		const button = screen.getByRole('button', { name: /search/i });

		await fireEvent.input(input, { target: { value: 'chicken, rice, vegetables' } });
		await fireEvent.click(button);

		expect(fetchSpy).toHaveBeenCalledWith('/search?ingredients=chicken, rice, vegetables');
	});
});
