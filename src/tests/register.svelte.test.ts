import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import RegisterForm from '$lib/RegisterForm/RegisterForm.svelte';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Helper: Renders the register form and returns key elements.
function setup() {
	render(RegisterForm);
	const nameInput = screen.getByLabelText(/username/i);
	const emailInput = screen.getByLabelText(/email/i);
	const passwordInput = screen.getByLabelText(/password/i);
	const registerButton = screen.getByRole('button', { name: /register/i });
	return { nameInput, emailInput, passwordInput, registerButton };
}

// Helper: Mocks the global fetch response.
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

describe('RegisterForm Integration', () => {
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

	it('handles successful registration', async () => {
		const user = userEvent.setup();
		const fakeResponse = { message: 'User registered successfully', userId: 1 };
		mockFetchResponse(fakeResponse, 201);

		const { nameInput, emailInput, passwordInput, registerButton } = setup();

		await user.type(nameInput, 'TestUser');
		await user.type(emailInput, 'test@example.com');
		await user.type(passwordInput, 'password123');
		await user.click(registerButton);

		await waitFor(() => {
			expect(screen.getByText(/User registered successfully/i)).toBeInTheDocument();
		});
	});

	it('handles duplicate email error', async () => {
		const user = userEvent.setup();
		mockFetchResponse({ message: 'Email already registered' }, 409);

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
		mockFetchResponse({ message: 'Internal Server Error' }, 500);

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
		render(RegisterForm);
		const registerButton = screen.getByRole('button', { name: /register/i });
		await user.click(registerButton);

		expect(screen.getByLabelText(/username/i)).toBeInvalid();
		expect(screen.getByLabelText(/email/i)).toBeInvalid();
		expect(screen.getByLabelText(/password/i)).toBeInvalid();
	});
});
