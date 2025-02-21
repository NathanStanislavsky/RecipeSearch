import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SearchButton from './SearchButton.svelte';
import '@testing-library/jest-dom/vitest';

describe('SearchButton', () => {
    it('should render a button with text "Search"', () => {
        render(SearchButton);

        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByRole('button')).toHaveTextContent('Search');
    });
});