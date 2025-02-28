import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import LoginForm from './LoginForm.svelte';

describe('LoginForm', () => {
	it('renders the email, password fields, and login button', () => {
		const { getByLabelText, getByRole } = render(LoginForm);
		expect(getByLabelText(/email/i)).toBeInTheDocument();
		expect(getByLabelText(/password/i)).toBeInTheDocument();
		expect(getByRole('button', { name: /login/i })).toBeInTheDocument();
	});
});