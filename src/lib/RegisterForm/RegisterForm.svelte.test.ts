import { describe, beforeEach, it, expect, vi } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RegisterForm from '$lib/RegisterForm/RegisterForm.svelte';
import { userEvent } from '@storybook/test';
import { TestHelper } from '../../utils/test/testHelper.ts';
import { TEST_USER } from '../../utils/test/testConstants.js';

type MockFetch = Mock;

describe('RegisterForm Component', () => {
	let mockFetch: MockFetch;

	beforeEach(() => {
		// Reset the mock before each test
		mockFetch = vi.fn();
		global.fetch = mockFetch;
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
			const mockResponse = { message: 'Registration successful' };
			mockFetch.mockResolvedValueOnce(TestHelper.createMockResponse(mockResponse, 200));

			// Fill in the form
			await user.type(screen.getByLabelText(/username/i), TEST_USER.name);
			await user.type(screen.getByLabelText(/email/i), TEST_USER.email);
			await user.type(screen.getByLabelText(/password/i), TEST_USER.correctPassword);

			// Submit the form
			await user.click(screen.getByRole('button', { name: /register/i }));

			// Verify fetch was called with correct data
			expect(mockFetch).toHaveBeenCalledWith('/register', {
				method: 'POST',
				body: expect.any(FormData)
			});

			// Verify form data
			const formData = mockFetch.mock.calls[0][1].body;
			expect(formData.get('name')).toBe(TEST_USER.name);
			expect(formData.get('email')).toBe(TEST_USER.email);
			expect(formData.get('password')).toBe(TEST_USER.correctPassword);
		});

		it('handles server error gracefully', async () => {
			const user = userEvent.setup();
			mockFetch.mockRejectedValueOnce(new Error('Network error'));

			// Fill in the form
			await user.type(screen.getByLabelText(/username/i), TEST_USER.name);
			await user.type(screen.getByLabelText(/email/i), TEST_USER.email);
			await user.type(screen.getByLabelText(/password/i), TEST_USER.correctPassword);

			// Submit the form
			await user.click(screen.getByRole('button', { name: /register/i }));

			// Verify error message is displayed
			expect(await screen.findByText('Internal Server Error')).toBeInTheDocument();
		});

		it('redirects to login page on successful registration', async () => {
			const user = userEvent.setup();
			const mockResponse = { message: 'Registration successful' };
			mockFetch.mockResolvedValueOnce(TestHelper.createMockResponse(mockResponse, 200));

			// Mock window.location
			const mockLocation = { href: '' };
			TestHelper.mockWindowLocation(mockLocation);

			// Fill in the form
			await user.type(screen.getByLabelText(/username/i), TEST_USER.name);
			await user.type(screen.getByLabelText(/email/i), TEST_USER.email);
			await user.type(screen.getByLabelText(/password/i), TEST_USER.correctPassword);

			// Submit the form
			await user.click(screen.getByRole('button', { name: /register/i }));

			// Verify redirect
			expect(window.location.href).toBe('/login');
		});

		it('displays server response message', async () => {
			const user = userEvent.setup();
			const mockResponse = { message: 'Custom server message' };
			mockFetch.mockResolvedValueOnce(TestHelper.createMockResponse(mockResponse, 400));

			// Fill in the form
			await user.type(screen.getByLabelText(/username/i), TEST_USER.name);
			await user.type(screen.getByLabelText(/email/i), TEST_USER.email);
			await user.type(screen.getByLabelText(/password/i), TEST_USER.correctPassword);

			// Submit the form
			await user.click(screen.getByRole('button', { name: /register/i }));

			// Verify message is displayed
			expect(await screen.findByText('Custom server message')).toBeInTheDocument();
		});
	});
});
