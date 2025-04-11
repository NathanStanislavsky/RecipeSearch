import { describe, beforeEach, it, expect, vi } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RegisterForm from '$lib/RegisterForm/RegisterForm.svelte';
import { userEvent } from '@storybook/test';

type MockFetch = Mock;

describe('RegisterForm Component', () => {
	let mockFetch: MockFetch;

	beforeEach(() => {
		// Reset the mock before each test
		mockFetch = vi.fn();
		global.fetch = mockFetch;
		render(RegisterForm);
	});

	it('renders all required inputs and the submit button', () => {
		expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
	});

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
		await user.type(emailInput, 'valid@example.com');
		expect(emailInput).toBeValid();
	});

	it('submits form data correctly', async () => {
		const user = userEvent.setup();
		const mockResponse = { message: 'Registration successful' };
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResponse)
		});

		// Fill in the form
		await user.type(screen.getByLabelText(/username/i), 'testuser');
		await user.type(screen.getByLabelText(/email/i), 'test@example.com');
		await user.type(screen.getByLabelText(/password/i), 'password123');

		// Submit the form
		await user.click(screen.getByRole('button', { name: /register/i }));

		// Verify fetch was called with correct data
		expect(mockFetch).toHaveBeenCalledWith('/register', {
			method: 'POST',
			body: expect.any(FormData)
		});

		// Verify form data
		const formData = mockFetch.mock.calls[0][1].body;
		expect(formData.get('name')).toBe('testuser');
		expect(formData.get('email')).toBe('test@example.com');
		expect(formData.get('password')).toBe('password123');
	});

	it('handles server error gracefully', async () => {
		const user = userEvent.setup();
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		// Fill in the form
		await user.type(screen.getByLabelText(/username/i), 'testuser');
		await user.type(screen.getByLabelText(/email/i), 'test@example.com');
		await user.type(screen.getByLabelText(/password/i), 'password123');

		// Submit the form
		await user.click(screen.getByRole('button', { name: /register/i }));

		// Verify error message is displayed
		expect(await screen.findByText('Internal Server Error')).toBeInTheDocument();
	});

	it('redirects to login page on successful registration', async () => {
		const user = userEvent.setup();
		const mockResponse = { message: 'Registration successful' };
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResponse)
		});

		// Mock window.location
		const mockLocation = { href: '' };
		Object.defineProperty(window, 'location', {
			value: mockLocation,
			writable: true
		});

		// Fill in the form
		await user.type(screen.getByLabelText(/username/i), 'testuser');
		await user.type(screen.getByLabelText(/email/i), 'test@example.com');
		await user.type(screen.getByLabelText(/password/i), 'password123');

		// Submit the form
		await user.click(screen.getByRole('button', { name: /register/i }));

		// Verify redirect
		expect(window.location.href).toBe('/login');
	});

	it('displays server response message', async () => {
		const user = userEvent.setup();
		const mockResponse = { message: 'Custom server message' };
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: () => Promise.resolve(mockResponse)
		});

		// Fill in the form
		await user.type(screen.getByLabelText(/username/i), 'testuser');
		await user.type(screen.getByLabelText(/email/i), 'test@example.com');
		await user.type(screen.getByLabelText(/password/i), 'password123');

		// Submit the form
		await user.click(screen.getByRole('button', { name: /register/i }));

		// Verify message is displayed
		expect(await screen.findByText('Custom server message')).toBeInTheDocument();
	});
});
