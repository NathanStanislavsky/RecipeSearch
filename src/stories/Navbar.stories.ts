import type { Meta, StoryObj } from '@storybook/svelte';
import Navbar from '$lib/Navbar/Navbar.svelte';
import { expect, within } from '@storybook/test';

interface User {
	id: number;
	email: string;
	name: string;
}

interface NavbarProps {
	user: User | null;
}

const meta = {
	title: 'Components/Navbar',
	component: Navbar,
	tags: ['autodocs'],
	argTypes: {
		user: {
			control: 'object',
			description:
				'User object. When null, the Navbar shows the Register button on the left and Log in link on the right.'
		}
	}
} satisfies Meta<NavbarProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggedOut: Story = {
	args: {
		user: null
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const registerButton = canvas.getByRole('button', { name: /register/i });
		const loginLink = canvas.getByRole('link', { name: /log in/i });

		await expect(registerButton).toBeInTheDocument();
		await expect(loginLink).toBeInTheDocument();
	}
};

export const LoggedIn: Story = {
	args: {
		user: { id: 1, email: 'test@example.com', name: 'Test User' }
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const userMenu = canvas.getByText('Test User');
		const logoutButton = canvas.getByRole('button', { name: /logout/i });

		await expect(userMenu).toBeInTheDocument();
		await expect(logoutButton).toBeInTheDocument();
	}
};
