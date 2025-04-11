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

	it('should render a button with text "Search"', () => {
		expect(button).toBeInTheDocument();
		expect(button).toHaveTextContent('Search');
	});

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

	it('should maintain focus styles on keyboard navigation', async () => {
		const user = userEvent.setup();
		await user.tab();
		expect(button).toHaveFocus();
		expect(button).toHaveClass('focus:ring-2');
		expect(button).toHaveClass('focus:ring-blue-500');
	});

	it('should handle keyboard events', async () => {
		const user = userEvent.setup();
		await user.tab();
		await user.keyboard('{Enter}');
		expect(onClickMock).toHaveBeenCalledTimes(1);
	});
});
