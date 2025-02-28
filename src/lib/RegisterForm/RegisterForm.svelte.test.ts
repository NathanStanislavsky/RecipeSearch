import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RegisterForm from '$lib/RegisterForm/RegisterForm.svelte';

describe('register form', () => {
	it('renders register form with all required inputs and submit button', () => {
		render(RegisterForm);
		expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
	});
});
