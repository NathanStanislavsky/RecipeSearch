import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import RegisterForm from '$lib/RegisterForm/RegisterForm.svelte';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('RegisterForm Integration', () => {
	beforeEach(() => {
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	it('handles successful registration', async () => {
		(global.fetch as jest.Mock).mockResolvedValueOnce(
			new Response(
				JSON.stringify({
					message: 'User registered successfully',
					userId: 1
				}),
				{
					status: 201,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)
		);

		render(RegisterForm);

		const nameInput = screen.getByLabelText(/username/i);
		const emailInput = screen.getByLabelText(/email/i);
		const passwordInput = screen.getByLabelText(/password/i);
		const registerButton = screen.getByRole('button', { name: /register/i });

		await userEvent.type(nameInput, 'TestUser');
		await userEvent.type(emailInput, 'test@example.com');
		await userEvent.type(passwordInput, 'password123');
		await userEvent.click(registerButton);

		await waitFor(() => {
			expect(screen.getByText(/User registered successfully/i)).toBeInTheDocument();
		});
	});

	it('handles duplicate email error', async () => {
		(global.fetch as jest.Mock).mockResolvedValueOnce(
			new Response(JSON.stringify({ message: 'Email already registered' }), {
				status: 409,
				headers: { 'Content-Type': 'application/json' }
			})
		);

		render(RegisterForm);

		const nameInput = screen.getByLabelText(/username/i);
		const emailInput = screen.getByLabelText(/email/i);
		const passwordInput = screen.getByLabelText(/password/i);
		const registerButton = screen.getByRole('button', { name: /register/i });

		await userEvent.type(nameInput, 'TestUser');
		await userEvent.type(emailInput, 'test@example.com');
		await userEvent.type(passwordInput, 'password123');
		await userEvent.click(registerButton);

		await waitFor(() => {
			expect(screen.getByText(/Email already registered/i)).toBeInTheDocument();
		});
	});

	it('handles server errors gracefully', async () => {
		(global.fetch as jest.Mock).mockResolvedValueOnce(
			new Response(JSON.stringify({ message: 'Internal Server Error' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			})
		);

		render(RegisterForm);

		const nameInput = screen.getByLabelText(/username/i);
		const emailInput = screen.getByLabelText(/email/i);
		const passwordInput = screen.getByLabelText(/password/i);
		const registerButton = screen.getByRole('button', { name: /register/i });

		await userEvent.type(nameInput, 'TestUser');
		await userEvent.type(emailInput, 'test@example.com');
		await userEvent.type(passwordInput, 'password123');
		await userEvent.click(registerButton);

		await waitFor(() => {
			expect(screen.getByText(/Internal Server Error/i)).toBeInTheDocument();
		});
	});

	it('displays validation errors for missing fields', async () => {
		render(RegisterForm);
		const registerButton = screen.getByRole('button', { name: /register/i });
		await userEvent.click(registerButton);

		expect(screen.getByLabelText(/username/i)).toBeInvalid();
		expect(screen.getByLabelText(/email/i)).toBeInvalid();
		expect(screen.getByLabelText(/password/i)).toBeInvalid();
	});
});
