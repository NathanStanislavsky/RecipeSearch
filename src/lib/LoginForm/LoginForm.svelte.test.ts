import { describe, beforeEach, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import LoginForm from './LoginForm.svelte';
import { userEvent } from '@storybook/test';

describe('LoginForm Component', () => {
	beforeAll(() => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

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

	it('validates email format', async () => {
		const user = userEvent.setup();
		await user.type(screen.getByLabelText(/email/i), 'invalid-email');
		await user.type(screen.getByLabelText(/password/i), 'password123');
		await user.click(screen.getByRole('button', { name: /login/i }));

		expect(screen.getByLabelText(/email/i)).toBeInvalid();
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

	it('shows generic error message on network error', async () => {
		const user = userEvent.setup();
		vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

		await user.type(screen.getByLabelText(/email/i), 'test@example.com');
		await user.type(screen.getByLabelText(/password/i), 'password123');
		await user.click(screen.getByRole('button', { name: /login/i }));

		await waitFor(() => {
			expect(screen.getByText('An error occurred during login')).toBeInTheDocument();
		});
	});

	it('resets loading state after error', async () => {
		const user = userEvent.setup();
		vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

		await user.type(screen.getByLabelText(/email/i), 'test@example.com');
		await user.type(screen.getByLabelText(/password/i), 'password123');
		await user.click(screen.getByRole('button', { name: /login/i }));

		await waitFor(() => {
			expect(screen.getByRole('button')).not.toBeDisabled();
			expect(screen.getByRole('button')).toHaveTextContent('Login');
		});
	});

	it('submits correct form data', async () => {
		const user = userEvent.setup();
		const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
			new Response(JSON.stringify({ success: true }), { status: 200 })
		);

		await user.type(screen.getByLabelText(/email/i), 'test@example.com');
		await user.type(screen.getByLabelText(/password/i), 'password123');
		await user.click(screen.getByRole('button', { name: /login/i }));

		expect(mockFetch).toHaveBeenCalledWith('/login', {
			method: 'POST',
			body: expect.any(FormData)
		});

		const formData = (mockFetch.mock.calls[0][1] as { body: FormData }).body;
		expect(formData.get('email')).toBe('test@example.com');
		expect(formData.get('password')).toBe('password123');
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
