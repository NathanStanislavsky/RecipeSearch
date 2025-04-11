import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import RegisterForm from '$lib/RegisterForm/RegisterForm.svelte';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockResponse } from '../utils/test/mockUtils.js';

// Helper: Renders the register form and returns key elements.
function setup() {
	render(RegisterForm);
	const nameInput = screen.getByLabelText(/username/i);
	const emailInput = screen.getByLabelText(/email/i);
	const passwordInput = screen.getByLabelText(/password/i);
	const registerButton = screen.getByRole('button', { name: /register/i });
	return { nameInput, emailInput, passwordInput, registerButton };
}

describe('RegisterForm Integration', () => {
	let mockFetch: ReturnType<typeof vi.fn>;

	beforeEach(() => {
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

	it('handles successful registration', async () => {
		const user = userEvent.setup();
		const fakeResponse = { message: 'User registered successfully', userId: 1 };
		mockFetch.mockResolvedValueOnce(createMockResponse(fakeResponse, 201));

		const { nameInput, emailInput, passwordInput, registerButton } = setup();

		await user.type(nameInput, 'TestUser');
		await user.type(emailInput, 'test@example.com');
		await user.type(passwordInput, 'password123');
		await user.click(registerButton);

		await waitFor(() => {
			expect(screen.getByText(/User registered successfully/i)).toBeInTheDocument();
		});

		expect(window.location.href).toBe('/login');
	});

	it('handles duplicate email error', async () => {
		const user = userEvent.setup();
		mockFetch.mockResolvedValueOnce(
			createMockResponse({ message: 'Email already registered' }, 409)
		);

		const { nameInput, emailInput, passwordInput, registerButton } = setup();

		await user.type(nameInput, 'TestUser');
		await user.type(emailInput, 'test@example.com');
		await user.type(passwordInput, 'password123');
		await user.click(registerButton);

		await waitFor(() => {
			expect(screen.getByText(/Email already registered/i)).toBeInTheDocument();
		});
	});

	it('handles server errors gracefully', async () => {
		const user = userEvent.setup();
		mockFetch.mockResolvedValueOnce(createMockResponse({ message: 'Internal Server Error' }, 500));

		const { nameInput, emailInput, passwordInput, registerButton } = setup();

		await user.type(nameInput, 'TestUser');
		await user.type(emailInput, 'test@example.com');
		await user.type(passwordInput, 'password123');
		await user.click(registerButton);

		await waitFor(() => {
			expect(screen.getByText(/Internal Server Error/i)).toBeInTheDocument();
		});
	});

	it('handles network errors gracefully', async () => {
		const user = userEvent.setup();
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		const { nameInput, emailInput, passwordInput, registerButton } = setup();

		await user.type(nameInput, 'TestUser');
		await user.type(emailInput, 'test@example.com');
		await user.type(passwordInput, 'password123');
		await user.click(registerButton);

		await waitFor(() => {
			expect(screen.getByText(/Internal Server Error/i)).toBeInTheDocument();
		});
	});

	it('displays validation errors for missing fields', async () => {
		const user = userEvent.setup();
		const { registerButton } = setup();

		// Submit the form without filling any fields
		await user.click(registerButton);

		// Wait for validation to be triggered
		await waitFor(() => {
			expect(screen.getByLabelText(/username/i)).toBeInvalid();
			expect(screen.getByLabelText(/email/i)).toBeInvalid();
			expect(screen.getByLabelText(/password/i)).toBeInvalid();
		});
	});

	it('validates email format', async () => {
		const user = userEvent.setup();
		const { emailInput, registerButton } = setup();

		await user.type(emailInput, 'invalid-email');
		await user.click(registerButton);

		// Wait for validation to be triggered
		await waitFor(() => {
			expect(emailInput).toBeInvalid();
		});
	});
});
