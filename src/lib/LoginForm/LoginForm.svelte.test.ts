import { describe, beforeEach, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import LoginForm from './LoginForm.svelte';
import { userEvent } from '@storybook/test';

describe('LoginForm Component', () => {
  beforeEach(() => {
    render(LoginForm);
  });

  it('renders email and password fields, and the login button', () => {
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('does not allow submission when fields are empty', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByLabelText(/email/i)).toBeInvalid();
    expect(screen.getByLabelText(/password/i)).toBeInvalid();
  });
});