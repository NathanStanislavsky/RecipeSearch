import type { Meta, StoryObj } from '@storybook/svelte';
import RecipeCardParent from '$lib/RecipeCardParent/RecipeCardParent.svelte';
import { expect, within } from '@storybook/test';
import type { TransformedRecipe } from '../types/recipe.js';

interface RecipeCardParentProps {
	recipes: TransformedRecipe[];
}

const meta = {
	title: 'Components/RecipeCardParent',
	component: RecipeCardParent,
	tags: ['autodocs'],
	argTypes: {
		recipes: {
			control: 'object',
			description:
				'Array of recipe objects containing name, minutes, nutrition, steps, description, ingredients, and score'
		}
	},
	args: {
		recipes: [
			{
				id: 1421065,
				name: 'Chili Stuffed Potatoes',
				minutes: 45,
				nutrition: '[350, 15, 8, 450, 25, 5, 40]',
				steps: '["Bake potatoes", "Prepare chili", "Stuff potatoes with chili", "Serve hot"]',
				description: 'Delicious baked potatoes stuffed with hearty chili',
				ingredients: '["potatoes", "ground beef", "beans", "tomatoes", "onions", "spices"]',
				score: 4.2
			}
		]
	}
} satisfies Meta<RecipeCardParentProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		recipes: [
			{
				id: 1421065,
				name: 'Chili Stuffed Potatoes',
				minutes: 45,
				nutrition: '[350, 15, 8, 450, 25, 5, 40]',
				steps: '["Bake potatoes", "Prepare chili", "Stuff potatoes with chili", "Serve hot"]',
				description: 'Delicious baked potatoes stuffed with hearty chili',
				ingredients: '["potatoes", "ground beef", "beans", "tomatoes", "onions", "spices"]',
				score: 4.2
			},
			{
				id: 1421066,
				name: 'Spicy Potato Bowls',
				minutes: 40,
				nutrition: '[320, 12, 6, 400, 22, 4, 35]',
				steps: '["Prepare potatoes", "Make spicy mixture", "Combine ingredients", "Garnish and serve"]',
				description: 'Hearty potato bowls with a spicy kick',
				ingredients: '["potatoes", "peppers", "onions", "cheese", "herbs", "spices"]',
				score: 4.0
			}
		]
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const recipeCards = canvas.getAllByRole('article');
		await expect(recipeCards).toHaveLength(2);

		// Verify each card has the expected content
		recipeCards.forEach(async (card) => {
			const minutes = within(card).getByText(/45\s*(min|minutes)/i);
			await expect(minutes).toBeInTheDocument();
		});
	}
};
