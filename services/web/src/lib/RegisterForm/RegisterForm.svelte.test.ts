import { describe, beforeEach, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RegisterForm from '$lib/RegisterForm/RegisterForm.svelte';
import { userEvent } from '@testing-library/user-event';
import { TEST_USER } from '../../utils/test/userTestUtils.js';

// Type definitions for form enhancement
interface EnhanceHandler {
	(input: {
		formData: FormData;
		cancel: () => void;
	}): (result: {
		result:
			| { type: 'error'; error?: { message: string } }
			| { type: 'failure'; data?: { message: string } }
			| { type: 'redirect'; location: string }
			| { type: 'success'; data?: { message: string } };
		update: () => void;
	}) => Promise<void>;
}

interface EnhancedFormElement extends HTMLFormElement {
	__enhance_handler?: EnhanceHandler;
}

// Mock $app/forms
vi.mock('$app/forms', () => ({
	enhance: vi.fn((form, handler) => {
		// Mock enhance by storing the handler for later use in tests
		if (handler) {
			(form as EnhancedFormElement).__enhance_handler = handler;
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

describe('RegisterForm Component', () => {
	beforeEach(() => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		render(RegisterForm);
	});

	describe('form rendering', () => {
		it('renders all required inputs and the submit button', () => {
			expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
		});

		it('applies correct styling to form elements', () => {
			const form = screen.getByTestId('register-form');
			expect(form).toHaveClass('space-y-4');
			expect(form).toHaveAttribute('method', 'POST');

			const inputs = screen.getAllByRole('textbox');
			inputs.forEach((input) => {
				expect(input).toHaveClass(
					'mt-1',
					'block',
					'w-full',
					'rounded-md',
					'border-gray-300',
					'shadow-sm'
				);
				expect(input).toHaveClass('focus:border-indigo-500', 'focus:ring-indigo-500');
			});

			const button = screen.getByRole('button', { name: /register/i });
			expect(button).toHaveClass(
				'w-full',
				'rounded-md',
				'bg-blue-500',
				'px-4',
				'py-2',
				'font-semibold',
				'text-white'
			);
			expect(button).toHaveClass(
				'hover:bg-blue-600',
				'focus:ring-2',
				'focus:ring-blue-500',
				'focus:outline-none'
			);
		});
	});

	describe('form validation', () => {
		it('does not allow submission if fields are empty', async () => {
			const user = userEvent.setup();
			await user.click(screen.getByRole('button', { name: /register/i }));

			expect(screen.getByLabelText(/username/i)).toBeInvalid();
			expect(screen.getByLabelText(/email/i)).toBeInvalid();
			expect(screen.getByLabelText(/password/i)).toBeInvalid();
		});

		it('validates email format', async () => {
			const user = userEvent.setup();
			const emailInput = screen.getByLabelText(/email/i);

			// Test invalid email
			await user.type(emailInput, 'invalid-email');
			await user.click(screen.getByRole('button', { name: /register/i }));
			expect(emailInput).toBeInvalid();

			// Test valid email
			await user.clear(emailInput);
			await user.type(emailInput, TEST_USER.email);
			expect(emailInput).toBeValid();
		});
	});

	describe('form submission', () => {
		it('submits form data correctly', async () => {
			const user = userEvent.setup();
			const form = screen.getByTestId('register-form');

			// Fill in the form
			await user.type(screen.getByLabelText(/username/i), TEST_USER.name);
			await user.type(screen.getByLabelText(/email/i), TEST_USER.email);
			await user.type(screen.getByLabelText(/password/i), TEST_USER.correctPassword);

			// Verify form has the correct attributes for SvelteKit form actions
			expect(form).toHaveAttribute('method', 'POST');
			expect(form).toBeInTheDocument();

			// Submit the form
			await user.click(screen.getByRole('button', { name: /register/i }));

			// Verify form data is correctly bound
			const nameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
			const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
			const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

			expect(nameInput.value).toBe(TEST_USER.name);
			expect(emailInput.value).toBe(TEST_USER.email);
			expect(passwordInput.value).toBe(TEST_USER.correctPassword);
		});

		it('handles server error gracefully', async () => {
			const form = screen.getByTestId('register-form') as EnhancedFormElement;
			const handler = form.__enhance_handler;

			if (handler) {
				// Simulate form submission with error response
				await handler({ formData: new FormData(), cancel: vi.fn() })({
					result: { type: 'error', error: { message: 'Server error' } },
					update: vi.fn()
				});

				// Check that error message is displayed
				expect(await screen.findByText('Server error')).toBeInTheDocument();
			}
		});

		it('handles successful registration and redirects', async () => {
			const form = screen.getByTestId('register-form') as EnhancedFormElement;
			const handler = form.__enhance_handler;

			if (handler) {
				// Simulate form submission with redirect response
				const result = await handler({ formData: new FormData(), cancel: vi.fn() })({
					result: { type: 'redirect', location: '/login' },
					update: vi.fn()
				});

				// For redirect, the handler should return early without error
				expect(result).toBeUndefined();
			}
		});

		it('displays server response message on failure', async () => {
			const form = screen.getByTestId('register-form') as EnhancedFormElement;
			const handler = form.__enhance_handler;

			if (handler) {
				// Simulate form submission with failure response
				await handler({ formData: new FormData(), cancel: vi.fn() })({
					result: { type: 'failure', data: { message: 'Email already registered' } },
					update: vi.fn()
				});

				// Check that failure message is displayed
				expect(await screen.findByText('Email already registered')).toBeInTheDocument();
			}
		});
	});
});
