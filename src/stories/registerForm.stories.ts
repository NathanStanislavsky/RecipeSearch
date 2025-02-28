import type { Meta, StoryObj } from '@storybook/svelte';
import RegisterForm from '$lib/RegisterForm/RegisterForm.svelte';
import { expect, within, waitFor } from '@storybook/test';

const meta = {
	title: 'Components/RegisterForm',
	component: RegisterForm,
	tags: ['autodocs'],
} satisfies Meta<RegisterForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Interactive: Story = {
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

		const loginButton = canvas.getByRole('button', { name: /register/i });
		await waitFor(() => expect(loginButton).toBeInTheDocument());
	}
};