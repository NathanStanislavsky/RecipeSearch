import { describe, beforeEach, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import LoginForm from '$lib/LoginForm/LoginForm.svelte';
import { userEvent } from '@storybook/test';
import { TestHelper } from '../../utils/test/testHelper.ts';

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
			vi.spyOn(global, 'fetch').mockImplementationOnce(() => new Promise(() => {}));

			await fillAndSubmitForm(user);

			expect(screen.getByRole('button')).toBeDisabled();
			expect(screen.getByRole('button')).toHaveTextContent('Logging in...');
		});

		it('shows error message on failed login', async () => {
			const user = userEvent.setup();
			const errorResponse = { error: { message: 'Invalid credentials' } };

			vi.spyOn(global, 'fetch').mockResolvedValueOnce(
				TestHelper.createMockResponse(errorResponse, 401)
			);

			await fillAndSubmitForm(user, mockUser.email, 'wrong-password');

			await waitFor(() => {
				expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
			});
		});

		it('shows generic error message on network error', async () => {
			const user = userEvent.setup();
			vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

			await fillAndSubmitForm(user);

			await waitFor(() => {
				expect(screen.getByText('An error occurred during login')).toBeInTheDocument();
			});
		});

		it('resets loading state after error', async () => {
			const user = userEvent.setup();
			vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

			await fillAndSubmitForm(user);

			await waitFor(() => {
				expect(screen.getByRole('button')).not.toBeDisabled();
				expect(screen.getByRole('button')).toHaveTextContent('Login');
			});
		});

		it('submits correct form data', async () => {
			const user = userEvent.setup();
			const mockFetch = vi
				.spyOn(global, 'fetch')
				.mockResolvedValueOnce(TestHelper.createMockResponse({ success: true }, 200));

			await fillAndSubmitForm(user);

			expect(mockFetch).toHaveBeenCalledWith('/login', {
				method: 'POST',
				body: expect.any(FormData)
			});

			const formData = (mockFetch.mock.calls[0][1] as { body: FormData }).body;
			expect(formData.get('email')).toBe(mockUser.email);
			expect(formData.get('password')).toBe(mockUser.password);
		});

		it('redirects to /search on successful login', async () => {
			const user = userEvent.setup();
			TestHelper.mockWindowLocation();

			vi.spyOn(global, 'fetch').mockResolvedValueOnce(
				TestHelper.createMockResponse({ success: true }, 200)
			);

			await fillAndSubmitForm(user);

			await waitFor(() => {
				expect(window.location.href).toBe('/search');
			});
		});
	});
});
