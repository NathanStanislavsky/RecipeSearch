import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import RegisterForm from '$lib/RegisterForm/RegisterForm.svelte';

describe('register form', () => {
	it('renders register form with all required inputs and submit button', () => {
		const { getByLabelText, getByRole } = render(RegisterForm);

		expect(getByLabelText(/username/i)).toBeInTheDocument();
		expect(getByLabelText(/email/i)).toBeInTheDocument();
		expect(getByLabelText(/password/i)).toBeInTheDocument();
        
		expect(getByRole('button', { name: /Register/i })).toBeInTheDocument();
	});

    it('does not allow submission if one or more fields are empty', async () => {
		const { getByLabelText, getByRole } = render(RegisterForm);

        const usernameInput = getByLabelText(/username/i);
		const emailInput = getByLabelText(/email/i);
		const passwordInput = getByLabelText(/password/i);

		const loginButton = getByRole('button', { name: /login/i });

		// Setup the user event instance
		const user = userEvent.setup();
		await user.click(loginButton);

        expect(usernameInput).toBeInvalid();
		expect(emailInput).toBeInvalid();
		expect(passwordInput).toBeInvalid();
	});
});
