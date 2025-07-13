import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import SearchButton from './SearchButton.svelte';
import '@testing-library/jest-dom/vitest';
import { userEvent } from '@storybook/test';

describe('SearchButton Component', () => {
	afterEach(() => {
		cleanup();
	});

	describe('with onClick handler', () => {
		let button: HTMLElement;
		let onClickMock: ReturnType<typeof vi.fn>;

		beforeEach(() => {
			onClickMock = vi.fn();
			render(SearchButton, { props: { onClick: onClickMock } });
			button = screen.getByRole('button');
		});

		it('should render a button with text "Search" and type "button"', () => {
			expect(button).toBeInTheDocument();
			expect(button).toHaveTextContent('Search');
			expect(button).toHaveAttribute('type', 'button');
		});

		it('should call the onClick function when clicked', async () => {
			const user = userEvent.setup();
			await user.click(button);
			expect(onClickMock).toHaveBeenCalledTimes(1);
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

	describe('without onClick handler (as submit button)', () => {
		let button: HTMLElement;

		beforeEach(() => {
			render(SearchButton, { props: {} });
			button = screen.getByRole('button');
		});

		it('should render a submit button with text "Search"', () => {
			expect(button).toBeInTheDocument();
			expect(button).toHaveTextContent('Search');
			expect(button).toHaveAttribute('type', 'submit');
		});
	});

});
