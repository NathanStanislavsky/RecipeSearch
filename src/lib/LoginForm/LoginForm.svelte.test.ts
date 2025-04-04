import { describe, beforeEach, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import LoginForm from './LoginForm.svelte';
import { userEvent } from '@storybook/test';

describe('LoginForm Component', () => {
	beforeEach(() => {
		render(LoginForm);
	});

	it('renders email and password fields, and the login button', () => {
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
	});

	it('does not allow submission when fields are empty', async () => {
		const user = userEvent.setup();
		await user.click(screen.getByRole('button', { name: /login/i }));

		expect(screen.getByLabelText(/email/i)).toBeInvalid();
		expect(screen.getByLabelText(/password/i)).toBeInvalid();
	});

	it('shows loading state during submission', async () => {
		const user = userEvent.setup();
		vi.spyOn(global, 'fetch').mockImplementationOnce(() => new Promise(() => {}));

		await user.type(screen.getByLabelText(/email/i), 'test@example.com');
		await user.type(screen.getByLabelText(/password/i), 'password123');
		await user.click(screen.getByRole('button', { name: /login/i }));

		expect(screen.getByRole('button')).toBeDisabled();
		expect(screen.getByRole('button')).toHaveTextContent('Logging in...');
	});

	it('shows error message on failed login', async () => {
		const user = userEvent.setup();
		vi.spyOn(global, 'fetch').mockResolvedValueOnce(
			new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401 })
		);

		await user.type(screen.getByLabelText(/email/i), 'test@example.com');
		await user.type(screen.getByLabelText(/password/i), 'wrong-password');
		await user.click(screen.getByRole('button', { name: /login/i }));

		await waitFor(() => {
			expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
		});
	});

	it('redirects to /search on successful login', async () => {
		const user = userEvent.setup();
		// Override window.location so that href is writable
		Object.defineProperty(window, 'location', {
			configurable: true,
			writable: true,
			value: { href: '' }
		});

		vi.spyOn(global, 'fetch').mockResolvedValueOnce(
			new Response(JSON.stringify({ success: true }), { status: 200 })
		);

		await user.type(screen.getByLabelText(/email/i), 'test@example.com');
		await user.type(screen.getByLabelText(/password/i), 'password123');
		await user.click(screen.getByRole('button', { name: /login/i }));

		await waitFor(() => {
			expect(window.location.href).toBe('/search');
		});
	});
});
