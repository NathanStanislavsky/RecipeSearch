import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import LoginForm from '$lib/LoginForm/LoginForm.svelte';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestHelper } from '../utils/test/testHelper.ts';
import { TEST_USER } from '../utils/test/testConstants.js';
import * as navigation from '$app/navigation';

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

// Helper: Render component and return key elements.
function setup() {
	render(LoginForm);
	const emailInput = screen.getByLabelText(/email/i);
	const passwordInput = screen.getByLabelText(/password/i);
	const loginButton = screen.getByRole('button', { name: /login/i });
	return { emailInput, passwordInput, loginButton };
}

async function simulateLogin(
	user: ReturnType<typeof userEvent.setup>,
	elements: ReturnType<typeof setup>,
	email: string,
	password: string
) {
	await user.type(elements.emailInput, email);
	await user.type(elements.passwordInput, password);
	await user.click(elements.loginButton);
}

describe('LoginForm Integration', () => {
	let mockFetch: ReturnType<typeof vi.fn>;
	let user: ReturnType<typeof userEvent.setup>;

	beforeEach(() => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		mockFetch = vi.fn();
		global.fetch = mockFetch;
		user = userEvent.setup();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	it('handles successful login and redirects to /search', async () => {
		const fakeResponse = { success: true, token: 'fake-jwt-token' };
		mockFetch.mockResolvedValueOnce(TestHelper.createMockResponse(fakeResponse, 200));

		const elements = setup();

		await simulateLogin(user, elements, TEST_USER.email, TEST_USER.correctPassword);

		await waitFor(() => {
			expect(navigation.goto).toHaveBeenCalledWith('/search');
		});

		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('shows loading state during login', async () => {
		const fakeResponse = { success: true, token: 'fake-jwt-token' };
		mockFetch.mockResolvedValueOnce(TestHelper.createMockResponse(fakeResponse, 200));

		const elements = setup();

		const loginPromise = simulateLogin(user, elements, TEST_USER.email, TEST_USER.correctPassword);

		await waitFor(() => {
			expect(elements.loginButton).toBeDisabled();
			expect(elements.loginButton).toHaveTextContent(/logging in.../i);
		});

		await loginPromise;
	});

	it('handles invalid credentials', async () => {
		const errorResponse = { error: { message: 'Invalid credentials' } };
		mockFetch.mockResolvedValueOnce(TestHelper.createMockResponse(errorResponse, 401));

		const elements = setup();

		await simulateLogin(user, elements, TEST_USER.email, TEST_USER.wrongPassword);

		await waitFor(() => {
			expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
		});
	});

	it('handles server errors gracefully', async () => {
		const user = userEvent.setup();
		const errorResponse = { error: { message: 'Internal Server Error' } };

		mockFetch.mockResolvedValueOnce(TestHelper.createMockResponse(errorResponse, 500));

		const { emailInput, passwordInput, loginButton } = setup();

		await user.type(emailInput, TEST_USER.email);
		await user.type(passwordInput, TEST_USER.correctPassword);
		await user.click(loginButton);

		await waitFor(() => {
			expect(screen.getByText(/Internal Server Error/i)).toBeInTheDocument();
		});
	});

	it('handles network errors gracefully', async () => {
		const user = userEvent.setup();
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		const { emailInput, passwordInput, loginButton } = setup();

		await user.type(emailInput, TEST_USER.email);
		await user.type(passwordInput, TEST_USER.correctPassword);
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
		const errorResponse = { error: { message: 'Invalid credentials' } };
		mockFetch.mockResolvedValueOnce(TestHelper.createMockResponse(errorResponse, 401));

		const { emailInput, passwordInput, loginButton } = setup();

		// First attempt with invalid credentials
		await user.type(emailInput, TEST_USER.email);
		await user.type(passwordInput, TEST_USER.wrongPassword);
		await user.click(loginButton);

		await waitFor(() => {
			expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
		});

		// Clear inputs and try again
		await user.clear(emailInput);
		await user.clear(passwordInput);
		await user.type(emailInput, TEST_USER.email);
		await user.type(passwordInput, TEST_USER.correctPassword);
		await user.click(loginButton);

		await waitFor(() => {
			expect(screen.queryByText(/Invalid credentials/i)).not.toBeInTheDocument();
		});
	});
});
