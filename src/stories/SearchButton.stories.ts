import type { Meta, StoryObj } from '@storybook/svelte';
import SearchButton from '$lib/SearchButton/SearchButton.svelte';
import { expect, spyOn, userEvent, within } from '@storybook/test';

interface SearchButtonProps {
	onClick: () => void;
	disabled?: boolean;
}

const meta = {
	title: 'Components/SearchButton',
	component: SearchButton,
	tags: ['autodocs'],
	argTypes: {
		onClick: {
			action: 'clicked',
			description: 'Function to call when the button is clicked',
			type: { name: 'function', required: true }
		},
		disabled: {
			control: 'boolean',
			description: 'Whether the button is disabled'
		}
	}
} satisfies Meta<SearchButtonProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		onClick: () => {
			alert('button is clicked');
		},
		disabled: false
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByRole('button', { name: /Search/i });

		await expect(button).toHaveTextContent('Search');
		await expect(button).not.toBeDisabled();

		const alertSpy = spyOn(window, 'alert').mockImplementation(() => {});
		await userEvent.click(button);

		expect(alertSpy).toHaveBeenCalledWith('button is clicked');
		alertSpy.mockRestore();
	}
};
