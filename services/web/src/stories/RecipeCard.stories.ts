import type { Meta, StoryObj } from '@storybook/svelte';
import RecipeCard from '$lib/RecipeCard/RecipeCard.svelte';
import { expect, within, waitFor } from '@storybook/test';
import type { TransformedRecipe } from '../types/recipe.js';

interface RecipeCardProps {
	recipe: TransformedRecipe;
}

const meta = {
	title: 'Components/RecipeCard',
	component: RecipeCard,
	tags: ['autodocs'],
	argTypes: {
		recipe: {
			control: 'object',
			description:
				'Recipe object containing name, minutes, nutrition, steps, description, ingredients, and score'
		}
	},
	args: {
		recipe: {
			id: 987,
			name: 'Sea Bass and Cucumbers in Champagne Sauce',
			minutes: 15,
			nutrition: '[200, 10, 5, 300, 20, 3, 25]',
			steps: '["Prepare the sea bass", "Make champagne sauce", "Combine with cucumbers"]',
			description: 'A delicious sea bass dish with cucumbers in a rich champagne sauce',
			ingredients: '["sea bass", "cucumbers", "champagne", "butter", "herbs"]',
			score: 4.5
		}
	}
} satisfies Meta<RecipeCardProps>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default state: basic recipe card display
export const Default: Story = {
	args: {
		recipe: {
			id: 987,
			name: 'Sea Bass and Cucumbers in Champagne Sauce',
			minutes: 15,
			nutrition: '[200, 10, 5, 300, 20, 3, 25]',
			steps: '["Prepare the sea bass", "Make champagne sauce", "Combine with cucumbers"]',
			description: 'A delicious sea bass dish with cucumbers in a rich champagne sauce',
			ingredients: '["sea bass", "cucumbers", "champagne", "butter", "herbs"]',
			score: 4.5
		}
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const title = canvas.getByText('Sea Bass and Cucumbers in Champagne Sauce');
		// Use a regex matcher to allow flexible matching for "15 min"
		const time = canvas.getByText(/15\s*min/i);

		await expect(title).toBeInTheDocument();
		await expect(time).toBeInTheDocument();
	}
};

// Interactive state: verify title exists on the card
export const Interactive: Story = {
	args: {
		recipe: {
			id: 987,
			name: 'Sea Bass and Cucumbers in Champagne Sauce',
			minutes: 15,
			nutrition: '[200, 10, 5, 300, 20, 3, 25]',
			steps: '["Prepare the sea bass", "Make champagne sauce", "Combine with cucumbers"]',
			description: 'A delicious sea bass dish with cucumbers in a rich champagne sauce',
			ingredients: '["sea bass", "cucumbers", "champagne", "butter", "herbs"]',
			score: 4.5
		}
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const titleElement = canvas.getByText('Sea Bass and Cucumbers in Champagne Sauce');

		await waitFor(() => expect(titleElement).toBeInTheDocument());
	}
};
