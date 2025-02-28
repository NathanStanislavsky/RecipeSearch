import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import LoginForm from './LoginForm.svelte';
import { userEvent } from '@testing-library/user-event';


describe('LoginForm', () => {
	it('renders the email, password fields, and login button', () => {
		const { getByLabelText, getByRole } = render(LoginForm);
		expect(getByLabelText(/email/i)).toBeInTheDocument();
		expect(getByLabelText(/password/i)).toBeInTheDocument();
		expect(getByRole('button', { name: /login/i })).toBeInTheDocument();
	});

    it("does not allow submission if one or more fields are empty", async () => {
        render(LoginForm);
    
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const loginButton = screen.getByRole("button", { name: /Login/i });
    
        await userEvent.click(loginButton);
    
        expect(emailInput).toBeInvalid();
        expect(passwordInput).toBeInvalid();
    });
});
