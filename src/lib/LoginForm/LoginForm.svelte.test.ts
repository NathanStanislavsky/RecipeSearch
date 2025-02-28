import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import login from './+page.svelte';

describe('login form', () => {
	it('renders login form with all fields', () => {
		render(login);
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
	});
});
