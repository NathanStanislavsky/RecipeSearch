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
});
