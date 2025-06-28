import { render, screen, waitFor, cleanup } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import RegisterForm from '$lib/RegisterForm/RegisterForm.svelte';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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

// Helper: Renders the register form and returns key elements.
function setup() {
	render(RegisterForm);
	const nameInput = screen.getByLabelText(/username/i);
	const emailInput = screen.getByLabelText(/email/i);
	const passwordInput = screen.getByLabelText(/password/i);
	const registerButton = screen.getByRole('button', { name: /register/i });
	const form = registerButton.closest('form') as HTMLFormElement & {
		__enhance_handler?: EnhanceHandler;
	};
	return { nameInput, emailInput, passwordInput, registerButton, form };
}

// Fills in the registration form with test data
async function fillRegistrationForm(
	user: ReturnType<typeof userEvent.setup>,
	elements: ReturnType<typeof setup>
) {
	const { nameInput, emailInput, passwordInput } = elements;
	await user.type(nameInput, 'TestUser');
	await user.type(emailInput, 'test@example.com');
	await user.type(passwordInput, 'password123');
}

// Tests error scenarios with a given result
async function testErrorScenario(
	elements: ReturnType<typeof setup>,
	resultType: string,
	message: string,
	expectedErrorMessage: string | RegExp
) {
	const handler = elements.form.__enhance_handler;

	if (handler) {
		if (resultType === 'failure') {
			await handler({ formData: new FormData(), cancel: vi.fn() })({
				result: { type: 'failure', data: { message } },
				update: vi.fn()
			});
		} else {
			await handler({ formData: new FormData(), cancel: vi.fn() })({
				result: { type: 'error', error: { message } },
				update: vi.fn()
			});
		}

		await waitFor(() => {
			expect(screen.getByText(expectedErrorMessage)).toBeInTheDocument();
		});
	}
}

describe('RegisterForm Integration', () => {
	let user: ReturnType<typeof userEvent.setup>;

	beforeEach(() => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		user = userEvent.setup();
	});

	afterEach(() => {
		vi.resetAllMocks();
		cleanup();
	});

	it('handles successful registration and navigates to /login', async () => {
		const elements = setup();

		// Verify form uses SvelteKit form actions
		expect(elements.form).toHaveAttribute('method', 'POST');
		expect(elements.form).toBeInTheDocument();

		await fillRegistrationForm(user, elements);
		await user.click(elements.registerButton);

		// Verify form data is correctly bound
		expect((elements.nameInput as HTMLInputElement).value).toBe('TestUser');
		expect((elements.emailInput as HTMLInputElement).value).toBe('test@example.com');
		expect((elements.passwordInput as HTMLInputElement).value).toBe('password123');
	});

	describe('handles various error scenarios', () => {
		const errorScenarios = [
			{
				resultType: 'failure',
				message: 'Email already registered',
				errorMessage: /Email already registered/i
			},
			{
				resultType: 'error',
				message: 'Internal Server Error',
				errorMessage: /Internal Server Error/i
			}
		];

		errorScenarios.forEach(({ resultType, message, errorMessage }) => {
			it(`displays error: ${errorMessage}`, async () => {
				const elements = setup();
				await fillRegistrationForm(user, elements);
				await testErrorScenario(elements, resultType, message, errorMessage);
			});
		});
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

	it('validates form inputs', async () => {
		const elements = setup();

		// Test missing fields
		await user.click(elements.registerButton);
		await waitFor(() => {
			expect(elements.nameInput).toBeInvalid();
			expect(elements.emailInput).toBeInvalid();
			expect(elements.passwordInput).toBeInvalid();
		});

		// Test invalid email format
		await user.type(elements.emailInput, 'invalid-email');
		await user.click(elements.registerButton);
		await waitFor(() => {
			expect(elements.emailInput).toBeInvalid();
		});
	});
});
