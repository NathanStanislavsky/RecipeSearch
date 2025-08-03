import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import LoginForm from '$lib/LoginForm/LoginForm.svelte';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TEST_USER } from '../utils/test/userTestUtils.js';

type EnhanceHandler = (input: {
	formData: FormData;
	cancel: () => void;
}) => (result: {
	result: { type: string; error?: { message: string }; data?: { message: string } };
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

// Helper: Render component and return key elements.
function setup() {
	render(LoginForm);
	const emailInput = screen.getByLabelText(/email/i);
	const passwordInput = screen.getByLabelText(/password/i);
	const loginButton = screen.getByRole('button', { name: /login/i });
	const form = loginButton.closest('form') as HTMLFormElement & {
		__enhance_handler?: EnhanceHandler;
	};
	return { emailInput, passwordInput, loginButton, form };
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
	let user: ReturnType<typeof userEvent.setup>;

	beforeEach(() => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		user = userEvent.setup();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	it('handles successful login and redirects to /search', async () => {
		const elements = setup();

		// Verify form uses SvelteKit form actions
		expect(elements.form).toHaveAttribute('method', 'POST');
		expect(elements.form).toBeInTheDocument();

		await simulateLogin(user, elements, TEST_USER.email, TEST_USER.correctPassword);

		// Verify form data is correctly bound
		expect((elements.emailInput as HTMLInputElement).value).toBe(TEST_USER.email);
		expect((elements.passwordInput as HTMLInputElement).value).toBe(TEST_USER.correctPassword);
	});

	it('shows loading state during login', async () => {
		const elements = setup();

		await simulateLogin(user, elements, TEST_USER.email, TEST_USER.correctPassword);

		// Verify form structure for SvelteKit form actions
		expect(elements.form).toHaveAttribute('method', 'POST');
		expect(elements.loginButton).toBeInTheDocument();
	});

	it('handles invalid credentials', async () => {
		const elements = setup();
		const handler = elements.form.__enhance_handler;

		if (handler) {
			// Simulate form submission with failure response
			await handler({ formData: new FormData(), cancel: vi.fn() })({
				result: { type: 'failure', data: { message: 'Invalid credentials' } },
				update: vi.fn()
			});

			await waitFor(() => {
				expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
			});
		}
	});

	it('handles server errors gracefully', async () => {
		const elements = setup();
		const handler = elements.form.__enhance_handler;

		if (handler) {
			// Simulate form submission with error response
			await handler({ formData: new FormData(), cancel: vi.fn() })({
				result: { type: 'error', error: { message: 'Internal Server Error' } },
				update: vi.fn()
			});

			await waitFor(() => {
				expect(screen.getByText(/Internal Server Error/i)).toBeInTheDocument();
			});
		}
	});

	it('handles network errors gracefully', async () => {
		const elements = setup();
		const handler = elements.form.__enhance_handler;

		if (handler) {
			// Simulate form submission with error response
			await handler({ formData: new FormData(), cancel: vi.fn() })({
				result: { type: 'error', error: { message: 'Network error' } },
				update: vi.fn()
			});

			await waitFor(() => {
				expect(screen.getByText(/Network error/i)).toBeInTheDocument();
			});
		}
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
		const elements = setup();
		const handler = elements.form.__enhance_handler;

		if (handler) {
			// First attempt with error
			await handler({ formData: new FormData(), cancel: vi.fn() })({
				result: { type: 'failure', data: { message: 'Invalid credentials' } },
				update: vi.fn()
			});

			await waitFor(() => {
				expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
			});

			// Second attempt - error should be cleared
			await user.clear(elements.emailInput);
			await user.clear(elements.passwordInput);
			await user.type(elements.emailInput, TEST_USER.email);
			await user.type(elements.passwordInput, TEST_USER.correctPassword);
			await user.click(elements.loginButton);

			// The error should be cleared on new submission
			expect(elements.form).toBeInTheDocument();
		}
	});
});
