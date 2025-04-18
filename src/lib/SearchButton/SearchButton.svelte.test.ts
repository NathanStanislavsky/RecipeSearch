import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import SearchButton from './SearchButton.svelte';
import '@testing-library/jest-dom/vitest';
import { userEvent } from '@storybook/test';

describe('SearchButton Component', () => {
	let button: HTMLElement;
	let onClickMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		onClickMock = vi.fn();
		render(SearchButton, { props: { onClick: onClickMock } });
		button = screen.getByRole('button');
	});

	afterEach(() => {
		cleanup();
	});

	describe('rendering', () => {
		it('should render a button with text "Search"', () => {
			expect(button).toBeInTheDocument();
			expect(button).toHaveTextContent('Search');
		});
	});

	describe('click handling', () => {
		it('should call the onClick function when clicked', async () => {
			const user = userEvent.setup();
			await user.click(button);
			expect(onClickMock).toHaveBeenCalledTimes(1);
		});

		it('should handle multiple clicks', async () => {
			const user = userEvent.setup();
			await user.click(button);
			await user.click(button);
			await user.click(button);
			expect(onClickMock).toHaveBeenCalledTimes(3);
		});

		it('should work with default onClick handler', () => {
			cleanup();
			render(SearchButton);
			const defaultButton = screen.getByRole('button');
			expect(defaultButton).toBeInTheDocument();

			expect(() => userEvent.click(defaultButton)).not.toThrow();
		});

		it('should handle rapid clicks', async () => {
			const user = userEvent.setup();
			const clickPromises = Array(5)
				.fill(null)
				.map(() => user.click(button));
			await Promise.all(clickPromises);
			expect(onClickMock).toHaveBeenCalledTimes(5);
		});
	});
});
