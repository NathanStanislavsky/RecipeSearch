import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SearchButton from './SearchButton.svelte';
import '@testing-library/jest-dom/vitest';

describe('SearchButton Component', () => {
	let button: HTMLElement;
	let onClickMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		onClickMock = vi.fn();
		render(SearchButton, { props: { onClick: onClickMock } });
		button = screen.getByRole('button');
	});

	it('should render a button with text "Search"', () => {
		expect(button).toBeInTheDocument();
		expect(button).toHaveTextContent('Search');
	});

	it('should call the onClick function when clicked', async () => {
		await fireEvent.click(button);
		expect(onClickMock).toHaveBeenCalled();
	});
});
