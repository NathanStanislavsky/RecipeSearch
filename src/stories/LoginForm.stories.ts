import type { Meta, StoryObj } from '@storybook/svelte';
import LoginForm from '$lib/LoginForm/LoginForm.svelte';
import { expect, within, waitFor } from '@storybook/test';

const meta = {
	title: 'Components/LoginForm',
	component: LoginForm,
	tags: ['autodocs'],
	argTypes: {
		email: {
			control: 'text',
			description: 'Initial email value'
		},
		password: {
			control: 'text',
			description: 'Initial password value'
		},
		onSubmit: {
			action: 'submitted',
			description: 'Function called when the form is submitted'
		}
	}
} satisfies Meta<object>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {}
};

export const Interactive: Story = {
	args: {},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// Verify header
		const header = canvas.getByRole('heading', { name: /Login/i });
		await waitFor(() => expect(header).toBeInTheDocument());

		// Verify email input field
		const emailInput = canvas.getByLabelText(/email/i);
		await waitFor(() => expect(emailInput).toBeInTheDocument());

		// Verify password input field
		const passwordInput = canvas.getByLabelText(/password/i);
		await waitFor(() => expect(passwordInput).toBeInTheDocument());

		// Verify login button
		const loginButton = canvas.getByRole('button', { name: /login/i });
		await waitFor(() => expect(loginButton).toBeInTheDocument());
	}
};
