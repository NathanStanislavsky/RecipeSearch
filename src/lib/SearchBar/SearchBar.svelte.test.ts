import { describe, expect, it } from 'vitest';
import SearchBar from './SearchBar.svelte';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@storybook/test';

describe('SearchBar Component', () => {
	describe('rendering', () => {
		it('should render textbox with default props', () => {
			render(SearchBar);
			const searchBar = screen.getByRole('textbox');

			expect(searchBar).toBeInTheDocument();
			expect(searchBar).toHaveAttribute(
				'placeholder',
				'Enter ingredients separated by commas (e.g., tomato, basil, garlic)'
			);
			expect(searchBar).toHaveValue('');
		});

		it('should render with custom placeholder', () => {
			const customPlaceholder = 'Search for recipes...';
			render(SearchBar, { placeholder: customPlaceholder });

			const searchBar = screen.getByRole('textbox');
			expect(searchBar).toHaveAttribute('placeholder', customPlaceholder);
		});

		it('should render with initial ingredients value', () => {
			const initialIngredients = 'chicken, rice';
			render(SearchBar, { ingredients: initialIngredients });

			const searchBar = screen.getByRole('textbox');
			expect(searchBar).toHaveValue(initialIngredients);
		});
	});

	describe('input handling', () => {
		it('should update ingredients value when user types', async () => {
			const user = userEvent.setup();
			render(SearchBar);

			const searchBar = screen.getByRole('textbox');
			const testInput = 'tomatoes, basil';

			await user.type(searchBar, testInput);
			expect(searchBar).toHaveValue(testInput);
		});

		it('should handle empty input', async () => {
			const user = userEvent.setup();
			render(SearchBar);

			const searchBar = screen.getByRole('textbox');
			await user.clear(searchBar);

			expect(searchBar).toHaveValue('');
		});

		it('should handle special characters in input', async () => {
			const user = userEvent.setup();
			render(SearchBar);

			const searchBar = screen.getByRole('textbox');
			const specialChars = 'chicken & rice, tomatoes (fresh)';
			await user.type(searchBar, specialChars);

			expect(searchBar).toHaveValue(specialChars);
		});
	});

	describe('accessibility', () => {
		it('should have proper ARIA attributes', () => {
			render(SearchBar);
			const searchBar = screen.getByRole('textbox');

			expect(searchBar).toHaveAttribute('type', 'text');
		});

		it('should be keyboard accessible', async () => {
			const user = userEvent.setup();
			render(SearchBar);

			const searchBar = screen.getByRole('textbox');
			await user.tab();
			expect(searchBar).toHaveFocus();

			await user.type(searchBar, 'test');
			expect(searchBar).toHaveValue('test');
		});
	});

	describe('edge cases', () => {
		it('should handle very long input', async () => {
			const user = userEvent.setup();
			render(SearchBar);

			const searchBar = screen.getByRole('textbox');
			const longInput = 'a'.repeat(1000);
			await user.type(searchBar, longInput);

			expect(searchBar).toHaveValue(longInput);
		});
	});
});
