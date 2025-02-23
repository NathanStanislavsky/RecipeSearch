import { describe, test, expect, vi, beforeEach, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	test('should render h1', () => {
		render(Page);
		expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('What is in your fridge?');
	});
});

describe('Page Integration Tests', () => {
	beforeEach(() => {
		vi.spyOn(console, 'log').mockImplementation(() => {});

		vi.clearAllMocks();
	});

	it('calls searchRecipes when ingredients are provided', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			json: vi.fn().mockResolvedValue({ success: true, data: ['recipe1', 'recipe2'] })
		});

		render(Page);

		const input = screen.getByRole('textbox');
		const button = screen.getByRole('button', { name: /search/i });

		await fireEvent.input(input, { target: { value: 'chicken' } });

		await fireEvent.click(button);

		expect(global.fetch).toHaveBeenCalledWith('/searchRecipes?ingredients=chicken');
	});
});
