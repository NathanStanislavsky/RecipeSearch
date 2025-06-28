import type { Meta, StoryObj } from '@storybook/svelte';
import RegisterForm from '$lib/RegisterForm/RegisterForm.svelte';
import { expect, within, waitFor } from '@storybook/test';

interface RegisterFormProps {}

const meta = {
	title: 'Components/RegisterForm',
	component: RegisterForm,
	tags: ['autodocs'],
	argTypes: {
		username: {
			control: 'text',
			description: 'Initial username value'
		},
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
} satisfies Meta<RegisterFormProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {}
};

export const Interactive: Story = {
	args: {},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		const header = canvas.getByRole('heading', { name: /register/i });
		await waitFor(() => expect(header).toBeInTheDocument());

		const usernameInput = canvas.getByLabelText(/username/i);
		await waitFor(() => expect(usernameInput).toBeInTheDocument());

		const emailInput = canvas.getByLabelText(/email/i);
		await waitFor(() => expect(emailInput).toBeInTheDocument());

		const passwordInput = canvas.getByLabelText(/password/i);
		await waitFor(() => expect(passwordInput).toBeInTheDocument());

		const registerButton = canvas.getByRole('button', { name: /register/i });
		await waitFor(() => expect(registerButton).toBeInTheDocument());
	}
};
