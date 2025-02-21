import type { Meta, StoryObj } from '@storybook/svelte';
import SearchBar from '$lib/SearchBar/SearchBar.svelte';
import { expect, within, waitFor } from '@storybook/test';

const meta = {
  title: 'Components/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  argTypes: {
    ingredients: {
      control: 'text',
      description: 'Current ingredients in the search input'
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the search input'
    }
  },
  args: {
    ingredients: '',
    placeholder: 'Potatoes, carrots, beef...'
  }
} satisfies Meta<SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default state: empty input with placeholder
export const Default: Story = {
  args: {
    ingredients: '',
    placeholder: 'Potatoes, carrots, beef...'
  }
};

// Focused state: simulate user focusing on the input
export const Focused: Story = {
  args: {
    ingredients: '',
    placeholder: 'Potatoes, carrots, beef...'
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText('Potatoes, carrots, beef...');
    input.focus();
    await waitFor(() => expect(input).toHaveFocus());
  }
};

// Filled state: input shows prefilled ingredients
export const Filled: Story = {
  args: {
    ingredients: 'Carrots',
    placeholder: 'Potatoes, carrots, beef...'
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText('Potatoes, carrots, beef...');
    await expect(input).toHaveValue('Carrots');
  }
};
