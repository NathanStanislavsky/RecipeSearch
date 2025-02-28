import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import LoginForm from './LoginForm.svelte';
import userEvent from '@testing-library/user-event';

describe('LoginForm', () => {
	const renderLoginForm = () => render(LoginForm);

	it('renders the email, password fields, and login button', () => {
		const { getByLabelText, getByRole } = renderLoginForm();
		expect(getByLabelText(/email/i)).toBeInTheDocument();
		expect(getByLabelText(/password/i)).toBeInTheDocument();
		expect(getByRole('button', { name: /login/i })).toBeInTheDocument();
	});

	it('does not allow submission if one or more fields are empty', async () => {
		const { getByLabelText, getByRole } = renderLoginForm();
		const emailInput = getByLabelText(/email/i);
		const passwordInput = getByLabelText(/password/i);
		const loginButton = getByRole('button', { name: /login/i });

		// Setup the user event instance
		const user = userEvent.setup();
		await user.click(loginButton);

		expect(emailInput).toBeInvalid();
		expect(passwordInput).toBeInvalid();
	});
});
