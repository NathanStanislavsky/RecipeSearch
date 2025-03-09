import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import LoginForm from '$lib/LoginForm/LoginForm.svelte';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('LoginForm Integration', () => {
	beforeEach(() => {
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	it('handles successful login', async () => {
		const fakeResponse = {
			success: true,
			token: 'fake-jwt-token'
		};

		(global.fetch as jest.Mock).mockResolvedValueOnce(
			new Response(JSON.stringify(fakeResponse), {
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Set-Cookie': 'jwt=fake-jwt-token; HttpOnly; Path=/; Max-Age=3600; Secure'
				}
			})
		);

		render(LoginForm);

		const emailInput = screen.getByLabelText(/email/i);
		const passwordInput = screen.getByLabelText(/password/i);
		const loginButton = screen.getByRole('button', { name: /login/i });

		await userEvent.type(emailInput, 'test@example.com');
		await userEvent.type(passwordInput, 'correct-password');
		await userEvent.click(loginButton);

		// Wait for UI update after successful login.
		await waitFor(() => {
			expect(screen.getByText(/welcome/i)).toBeInTheDocument();
		});
	});

	it('handles invalid credentials', async () => {
		// Mock fetch to return a 401 response with an error message.
		(global.fetch as jest.Mock).mockResolvedValueOnce(
			new Response(JSON.stringify({ message: 'Invalid credentials' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			})
		);

		render(LoginForm);

		const emailInput = screen.getByLabelText(/email/i);
		const passwordInput = screen.getByLabelText(/password/i);
		const loginButton = screen.getByRole('button', { name: /login/i });

		await userEvent.type(emailInput, 'test@example.com');
		await userEvent.type(passwordInput, 'wrong-password');
		await userEvent.click(loginButton);

		// Wait for the error message to appear.
		await waitFor(() => {
			expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
		});
	});

	it('handles server errors gracefully', async () => {
		// Mock fetch to simulate a server error (500).
		(global.fetch as jest.Mock).mockResolvedValueOnce(
			new Response(JSON.stringify({ message: 'login failed' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			})
		);

		render(LoginForm);

		const emailInput = screen.getByLabelText(/email/i);
		const passwordInput = screen.getByLabelText(/password/i);
		const loginButton = screen.getByRole('button', { name: /login/i });

		await userEvent.type(emailInput, 'test@example.com');
		await userEvent.type(passwordInput, 'correct-password');
		await userEvent.click(loginButton);

		// Wait for the generic server error message to appear.
		await waitFor(() => {
			expect(screen.getByText(/login failed/i)).toBeInTheDocument();
		});
	});

	it('displays validation errors for missing fields', async () => {
		render(LoginForm);
		const loginButton = screen.getByRole('button', { name: /login/i });
		await userEvent.click(loginButton);

		expect(screen.getByLabelText(/email/i)).toBeInvalid();
		expect(screen.getByLabelText(/password/i)).toBeInvalid();
	});
});
