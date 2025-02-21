import type { Meta, StoryObj } from '@storybook/svelte';
import Button from '$lib/SearchButton/SearchButton.svelte';
import { expect, spyOn, userEvent, within } from '@storybook/test';

const meta = {
  title: 'Components/SearchButton',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    onClick: {
      action: 'clicked',
      description: 'Function to call when the button is clicked',
      type: { name: 'function', required: true }
    }
  }
} satisfies Meta<Button>;

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
    
    const alertSpy = spyOn(window, 'alert').mockImplementation(() => {});
    await userEvent.click(button);
    
    expect(alertSpy).toHaveBeenCalledWith('button is clicked');
    alertSpy.mockRestore();
  }
};