import { beforeEach, describe, expect, it } from "vitest";
import SearchBar from "./SearchBar.svelte";
import '@testing-library/jest-dom/vitest';
import { render, screen } from "@testing-library/svelte";

describe('SearchBar Component', () => {
    let searchBar: HTMLElement;

    beforeEach(() => {
        render(SearchBar);
        searchBar = screen.getByRole('textbox');
    });

    it('should render textbox', () => {
        expect(searchBar).toBeInTheDocument();
        expect(searchBar).toHaveAttribute('placeholder', 'Potatoes, carrots, beef...');
    });
});