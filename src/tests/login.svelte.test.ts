import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import LoginForm from '$lib/LoginForm/LoginForm.svelte';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Helper: Render component and return key elements.
function setup() {
	render(LoginForm);
	const emailInput = screen.getByLabelText(/email/i);
	const passwordInput = screen.getByLabelText(/password/i);
	const loginButton = screen.getByRole('button', { name: /login/i });
	return { emailInput, passwordInput, loginButton };
}

// Helper: Set up a mock fetch response.
function mockFetchResponse(responseData: object, status: number, additionalHeaders = {}) {
	(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
		new Response(JSON.stringify(responseData), {
			status,
			headers: {
				'Content-Type': 'application/json',
				...additionalHeaders
			}
		})
	);
}

describe('LoginForm Integration', () => {
	beforeEach(() => {
		global.fetch = vi.fn();

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
		mockFetchResponse(fakeResponse, 200, {
			'Set-Cookie': 'jwt=fake-jwt-token; HttpOnly; Path=/; Max-Age=3600; Secure'
		});

		const { emailInput, passwordInput, loginButton } = setup();

		await user.type(emailInput, 'test@example.com');
		await user.type(passwordInput, 'correct-password');
		await user.click(loginButton);

		await waitFor(() => {
			expect(window.location.href).toBe('/search');
		});
	});

	it('handles invalid credentials', async () => {
		const user = userEvent.setup();
		mockFetchResponse({ message: 'Invalid credentials' }, 401);

		const { emailInput, passwordInput, loginButton } = setup();

		await user.type(emailInput, 'test@example.com');
		await user.type(passwordInput, 'wrong-password');
		await user.click(loginButton);

		await waitFor(() => {
			expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
		});
	});

	it('handles server errors gracefully', async () => {
		const user = userEvent.setup();
		mockFetchResponse({ message: 'login failed' }, 500);

		const { emailInput, passwordInput, loginButton } = setup();

		await user.type(emailInput, 'test@example.com');
		await user.type(passwordInput, 'correct-password');
		await user.click(loginButton);

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
