import { describe, expect, it } from "vitest";
import SearchBar from "./SearchBar.svelte";
import '@testing-library/jest-dom/vitest';
import { render, screen } from "@testing-library/svelte";

describe('SearchBar Component', () => {
    it('should render textbox', () => {
        render(SearchBar);

        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Potatoes, carrots, beef...');
    });
});