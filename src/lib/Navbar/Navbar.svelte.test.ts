import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Navbar from '$lib/Navbar/Navbar.svelte';

describe('navigation bar', () => {
	it('renders the website name', () => {
		render(Navbar);
		expect(screen.getByText('PantryChef')).toBeInTheDocument();
	});

	it('shows "Register" and "Sign in" when user is not logged in', () => {
		render(Navbar, { user: null });

		expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /search/i })).not.toBeInTheDocument();
	});
});
