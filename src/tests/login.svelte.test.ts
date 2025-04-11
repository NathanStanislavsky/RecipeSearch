import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import LoginForm from '$lib/LoginForm/LoginForm.svelte';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockResponse } from '../utils/test/mockUtils.js';

// Helper: Render component and return key elements.
function setup() {
	render(LoginForm);
	const emailInput = screen.getByLabelText(/email/i);
	const passwordInput = screen.getByLabelText(/password/i);
	const loginButton = screen.getByRole('button', { name: /login/i });
	return { emailInput, passwordInput, loginButton };
}

describe('LoginForm Integration', () => {
	let mockFetch: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		mockFetch = vi.fn();
		global.fetch = mockFetch;

		Object.defineProperty(window, 'location', {
			configurable: true,
			writable: true,
			value: {
				href: '',
				assign: vi.fn(),
				replace: vi.fn(),
				reload: vi.fn()
			}
		});
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	it('handles successful login and redirects to /search', async () => {
		const user = userEvent.setup();
		const fakeResponse = { success: true, token: 'fake-jwt-token' };
		mockFetch.mockResolvedValueOnce(createMockResponse(fakeResponse, 200));

		const { emailInput, passwordInput, loginButton } = setup();

		await user.type(emailInput, 'test@example.com');
		await user.type(passwordInput, 'correct-password');
		await user.click(loginButton);

		await waitFor(() => {
			expect(window.location.href).toBe('/search');
		});
	});

	it('shows loading state during login', async () => {
		const user = userEvent.setup();
		const fakeResponse = { success: true, token: 'fake-jwt-token' };
		mockFetch.mockResolvedValueOnce(createMockResponse(fakeResponse, 200));

		const { emailInput, passwordInput, loginButton } = setup();

		await user.type(emailInput, 'test@example.com');
		await user.type(passwordInput, 'correct-password');
		await user.click(loginButton);

		expect(loginButton).toBeDisabled();
		expect(loginButton).toHaveTextContent('Logging in...');
	});

	it('handles invalid credentials', async () => {
		const user = userEvent.setup();
		mockFetch.mockResolvedValueOnce(createMockResponse({ message: 'Invalid credentials' }, 401));

		const { emailInput, passwordInput, loginButton } = setup();

		await user.type(emailInput, 'test@example.com');
		await user.type(passwordInput, 'wrong-password');
		await user.click(loginButton);

		await waitFor(() => {
			expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
		});
	});

	it('handles server errors gracefully', async () => {
		const user = userEvent.setup();
		mockFetch.mockResolvedValueOnce(createMockResponse({ message: 'Internal Server Error' }, 500));

		const { emailInput, passwordInput, loginButton } = setup();

		await user.type(emailInput, 'test@example.com');
		await user.type(passwordInput, 'correct-password');
		await user.click(loginButton);

		await waitFor(() => {
			expect(screen.getByText(/Internal Server Error/i)).toBeInTheDocument();
		});
	});

	it('handles network errors gracefully', async () => {
		const user = userEvent.setup();
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		const { emailInput, passwordInput, loginButton } = setup();

		await user.type(emailInput, 'test@example.com');
		await user.type(passwordInput, 'correct-password');
		await user.click(loginButton);

		await waitFor(() => {
			expect(screen.getByText(/An error occurred during login/i)).toBeInTheDocument();
		});
	});

	it('displays validation errors for missing fields', async () => {
		const user = userEvent.setup();
		const { loginButton } = setup();

		await user.click(loginButton);

		await waitFor(() => {
			expect(screen.getByLabelText(/email/i)).toBeInvalid();
			expect(screen.getByLabelText(/password/i)).toBeInvalid();
		});
	});

	it('validates email format', async () => {
		const user = userEvent.setup();
		const { emailInput, loginButton } = setup();

		await user.type(emailInput, 'invalid-email');
		await user.click(loginButton);

		await waitFor(() => {
			expect(emailInput).toBeInvalid();
		});
	});

	it('clears error message when form is resubmitted', async () => {
		const user = userEvent.setup();
		mockFetch.mockResolvedValueOnce(createMockResponse({ message: 'Invalid credentials' }, 401));

		const { emailInput, passwordInput, loginButton } = setup();

		// First attempt with invalid credentials
		await user.type(emailInput, 'test@example.com');
		await user.type(passwordInput, 'wrong-password');
		await user.click(loginButton);

		await waitFor(() => {
			expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
		});

		// Clear inputs and try again
		await user.clear(emailInput);
		await user.clear(passwordInput);
		await user.type(emailInput, 'test@example.com');
		await user.type(passwordInput, 'correct-password');
		await user.click(loginButton);

		await waitFor(() => {
			expect(screen.queryByText(/Invalid credentials/i)).not.toBeInTheDocument();
		});
	});
});
