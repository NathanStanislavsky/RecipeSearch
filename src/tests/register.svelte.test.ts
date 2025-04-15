import { render, screen, waitFor, cleanup } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import RegisterForm from '$lib/RegisterForm/RegisterForm.svelte';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestHelper } from '../utils/test/testHelper.ts';

// Helper: Renders the register form and returns key elements.
function setup() {
	render(RegisterForm);
	const nameInput = screen.getByLabelText(/username/i);
	const emailInput = screen.getByLabelText(/email/i);
	const passwordInput = screen.getByLabelText(/password/i);
	const registerButton = screen.getByRole('button', { name: /register/i });
	return { nameInput, emailInput, passwordInput, registerButton };
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

// Tests error scenarios with a given response
async function testErrorScenario(
	user: ReturnType<typeof userEvent.setup>,
	mockResponse: Response,
	expectedErrorMessage: string | RegExp
) {
	const elements = setup();
	await fillRegistrationForm(user, elements);
	await user.click(elements.registerButton);

	await waitFor(() => {
		expect(screen.getByText(expectedErrorMessage)).toBeInTheDocument();
	});
}

function mockWindowLocation() {
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
}

describe('RegisterForm Integration', () => {
	let mockFetch: ReturnType<typeof vi.fn>;
	let user: ReturnType<typeof userEvent.setup>;

	beforeEach(() => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		mockFetch = vi.fn();
		global.fetch = mockFetch;
		mockWindowLocation();
		user = userEvent.setup();
	});

	afterEach(() => {
		vi.resetAllMocks();
		cleanup();
	});

	it('handles successful registration', async () => {
		const fakeResponse = { message: 'User registered successfully', userId: 1 };
		mockFetch.mockResolvedValueOnce(TestHelper.createMockResponse(fakeResponse, 201));

		const elements = setup();
		await fillRegistrationForm(user, elements);
		await user.click(elements.registerButton);

		await waitFor(() => {
			expect(screen.getByText(/User registered successfully/i)).toBeInTheDocument();
		});

		expect(window.location.href).toBe('/login');
	});

	describe('handles various error scenarios', async () => {
		const errorScenarios = [
			{
				response: TestHelper.createMockResponse({ message: 'Email already registered' }, 409),
				errorMessage: /Email already registered/i
			},
			{
				response: TestHelper.createMockResponse({ message: 'Internal Server Error' }, 500),
				errorMessage: /Internal Server Error/i
			}
		];

		errorScenarios.forEach(({ response, errorMessage }) => {
			it(`displays error: ${errorMessage}`, async () => {
				mockFetch.mockResolvedValueOnce(response);
				await testErrorScenario(user, response, errorMessage);
			});
		});
	});

	it('handles network errors gracefully', async () => {
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		const elements = setup();
		await fillRegistrationForm(user, elements);
		await user.click(elements.registerButton);

		await waitFor(() => {
			expect(screen.getByText(/Internal Server Error/i)).toBeInTheDocument();
		});
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
