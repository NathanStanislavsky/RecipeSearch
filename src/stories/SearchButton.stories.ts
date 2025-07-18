import type { Meta, StoryObj } from '@storybook/svelte';
import SearchButton from '$lib/SearchButton/SearchButton.svelte';
import { expect, spyOn, userEvent, within } from '@storybook/test';

interface SearchButtonProps {
	onClick?: () => void;
}

const meta = {
	title: 'Components/SearchButton',
	component: SearchButton,
	tags: ['autodocs'],
	argTypes: {
		onClick: {
			action: 'clicked',
			description: 'Function to call when the button is clicked (optional)',
			type: { name: 'function', required: false }
		}
	}
} satisfies Meta<SearchButtonProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		onClick: () => {
			alert('button is clicked');
		}
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByRole('button', { name: /Search/i });

		await expect(button).toHaveTextContent('Search');
		await expect(button).not.toBeDisabled();
		await expect(button).toHaveAttribute('type', 'button');

		const alertSpy = spyOn(window, 'alert').mockImplementation(() => {});
		await userEvent.click(button);

		expect(alertSpy).toHaveBeenCalledWith('button is clicked');
		alertSpy.mockRestore();
	}
};

export const AsSubmitButton: Story = {
	args: {},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByRole('button', { name: /Search/i });

		await expect(button).toHaveTextContent('Search');
		await expect(button).not.toBeDisabled();
		await expect(button).toHaveAttribute('type', 'submit');
	}
};
