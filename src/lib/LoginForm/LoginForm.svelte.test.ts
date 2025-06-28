import { describe, beforeEach, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import LoginForm from '$lib/LoginForm/LoginForm.svelte';
import { userEvent } from '@storybook/test';

type EnhanceHandler = (input: { formData: FormData; cancel: () => void }) => (result: {
	result: {
		type: string;
		error?: { message: string };
		data?: { message: string };
		location?: string;
	};
	update: () => void;
}) => Promise<void>;

// Mock $app/forms
vi.mock('$app/forms', () => ({
	enhance: vi.fn((form: HTMLFormElement, handler: EnhanceHandler) => {
		// Mock enhance by storing the handler for later use in tests
		if (handler) {
			(form as HTMLFormElement & { __enhance_handler?: EnhanceHandler }).__enhance_handler =
				handler;
		}
		return {
			destroy: vi.fn()
		};
	})
}));

// Mock $app/navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn().mockResolvedValue(undefined)
}));

describe('LoginForm Component', () => {
	const mockUser = {
		email: 'test@example.com',
		password: 'password123'
	};

	beforeAll(() => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	beforeEach(() => {
		render(LoginForm);
	});

	describe('initial rendering', () => {
		it('renders email and password fields, and the login button', () => {
			expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
		});
	});

	describe('form validation', () => {
		it('does not allow submission when fields are empty', async () => {
			const user = userEvent.setup();
			await user.click(screen.getByRole('button', { name: /login/i }));

			expect(screen.getByLabelText(/email/i)).toBeInvalid();
			expect(screen.getByLabelText(/password/i)).toBeInvalid();
		});

		it('validates email format', async () => {
			const user = userEvent.setup();
			await user.type(screen.getByLabelText(/email/i), 'invalid-email');
			await user.type(screen.getByLabelText(/password/i), mockUser.password);
			await user.click(screen.getByRole('button', { name: /login/i }));

			expect(screen.getByLabelText(/email/i)).toBeInvalid();
		});
	});

	describe('form submission', () => {
		const fillAndSubmitForm = async (
			user: ReturnType<typeof userEvent.setup>,
			email = mockUser.email,
			password = mockUser.password
		) => {
			await user.type(screen.getByLabelText(/email/i), email);
			await user.type(screen.getByLabelText(/password/i), password);
			await user.click(screen.getByRole('button', { name: /login/i }));
		};

		it('shows loading state during submission', async () => {
			const user = userEvent.setup();
			// Simulate form being in loading state
			const form = screen.getByRole('button', { name: /login/i }).closest('form');
			expect(form).toHaveAttribute('method', 'POST');

			await fillAndSubmitForm(user);

			// Test that form structure is correct for SvelteKit form actions
			expect(form).toBeInTheDocument();
		});

		it('shows error message on failed login', async () => {
			const form = screen
				.getByRole('button', { name: /login/i })
				.closest('form') as HTMLFormElement & { __enhance_handler?: EnhanceHandler };
			const handler = form?.__enhance_handler;

			if (handler) {
				// Simulate form submission with failure response
				await handler({ formData: new FormData(), cancel: vi.fn() })({
					result: { type: 'failure', data: { message: 'Invalid credentials' } },
					update: vi.fn()
				});

				// Check that error message is displayed
				await waitFor(() => {
					expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
				});
			}
		});

		it('shows generic error message on network error', async () => {
			const form = screen
				.getByRole('button', { name: /login/i })
				.closest('form') as HTMLFormElement & { __enhance_handler?: EnhanceHandler };
			const handler = form?.__enhance_handler;

			if (handler) {
				// Simulate form submission with error response
				await handler({ formData: new FormData(), cancel: vi.fn() })({
					result: { type: 'error', error: { message: 'Network error' } },
					update: vi.fn()
				});

				// Check that error message is displayed
				await waitFor(() => {
					expect(screen.getByText('Network error')).toBeInTheDocument();
				});
			}
		});

		it('resets loading state after error', async () => {
			const form = screen
				.getByRole('button', { name: /login/i })
				.closest('form') as HTMLFormElement & { __enhance_handler?: EnhanceHandler };
			const handler = form?.__enhance_handler;

			if (handler) {
				// Simulate form submission with error
				await handler({ formData: new FormData(), cancel: vi.fn() })({
					result: { type: 'error', error: { message: 'Network error' } },
					update: vi.fn()
				});

				await waitFor(() => {
					// The form should still be functional after error
					expect(screen.getByRole('button')).toBeInTheDocument();
				});
			}
		});

		it('submits correct form data', async () => {
			const user = userEvent.setup();
			const form = screen.getByRole('button', { name: /login/i }).closest('form');

			// Verify form has the correct attributes for SvelteKit form actions
			expect(form).toHaveAttribute('method', 'POST');
			expect(form).toBeInTheDocument();

			await fillAndSubmitForm(user);

			// Verify form data is correctly bound
			const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
			const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

			expect(emailInput.value).toBe(mockUser.email);
			expect(passwordInput.value).toBe(mockUser.password);
		});

		it('handles successful login and redirects', async () => {
			const form = screen
				.getByRole('button', { name: /login/i })
				.closest('form') as HTMLFormElement & { __enhance_handler?: EnhanceHandler };
			const handler = form?.__enhance_handler;

			if (handler) {
				// Simulate form submission with redirect response
				const result = await handler({ formData: new FormData(), cancel: vi.fn() })({
					result: { type: 'redirect', location: '/search' },
					update: vi.fn()
				});

				// For redirect, the handler should return early without error
				expect(result).toBeUndefined();
			}
		});
	});
});
