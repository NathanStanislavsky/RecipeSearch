import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Navbar from '$lib/Navbar/Navbar.svelte';

describe('navigation bar', () => {
	it('renders the website name', () => {
		render(Navbar);
		expect(screen.getByText('PantryChef')).toBeInTheDocument();
	});
});
