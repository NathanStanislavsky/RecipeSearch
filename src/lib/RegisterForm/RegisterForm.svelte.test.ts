import { describe, beforeEach, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RegisterForm from '$lib/RegisterForm/RegisterForm.svelte';
import { userEvent } from '@storybook/test';

describe('RegisterForm Component', () => {
  beforeEach(() => {
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
});