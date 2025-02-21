import { describe, it, expect, beforeEach} from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SearchButton from './SearchButton.svelte';
import '@testing-library/jest-dom/vitest';

describe('SearchForm', () => {
    let button: HTMLElement;

    beforeEach(() => {
        render(SearchButton);
        button = screen.getByRole('button');
    });

    it('should render a button with text "Search"', () => {
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent('Search');
    });
});