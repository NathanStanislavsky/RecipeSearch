import type { Meta, StoryObj } from '@storybook/svelte';
import RecipeCardParent from '$lib/RecipeCardParent/RecipeCardParent.svelte';
import { expect, within } from '@storybook/test';

interface Recipe {
	image: string;
	title: string;
	readyInMinutes: number;
	servings: number;
	sourceUrl: string;
}

interface RecipeCardParentProps {
	recipes: Recipe[];
}

const meta = {
	title: 'Components/RecipeCardParent',
	component: RecipeCardParent,
	tags: ['autodocs'],
	argTypes: {
		recipes: {
			control: 'object',
			description:
				'Array of recipe objects containing image, title, readyInMinutes, servings, and sourceUrl'
		}
	},
	args: {
		recipes: [
			{
				image: 'https://img.spoonacular.com/recipes/1421065-556x370.jpeg',
				readyInMinutes: 45,
				servings: 1,
				sourceUrl: 'https://fountainavenuekitchen.com/chili-stuffed-potatoes/',
				title: 'Chili Stuffed Potatoes'
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
				image: 'https://img.spoonacular.com/recipes/1421065-556x370.jpeg',
				readyInMinutes: 45,
				servings: 1,
				sourceUrl: 'https://fountainavenuekitchen.com/chili-stuffed-potatoes/',
				title: 'Chili Stuffed Potatoes'
			},
			{
				image: 'https://img.spoonacular.com/recipes/1421065-556x370.jpeg',
				readyInMinutes: 45,
				servings: 1,
				sourceUrl: 'https://fountainavenuekitchen.com/chili-stuffed-potatoes/',
				title: 'Chili Stuffed Potatoes'
			}
		]
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const recipeCards = canvas.getAllByRole('article');
		await expect(recipeCards).toHaveLength(2);

		// Verify each card has the expected content
		recipeCards.forEach(async (card) => {
			const title = within(card).getByText('Chili Stuffed Potatoes');
			const image = within(card).getByRole('img');
			const time = within(card).getByText('45 min');
			const servings = within(card).getByText('1 serving');

			await expect(title).toBeInTheDocument();
			await expect(image).toHaveAttribute(
				'src',
				'https://img.spoonacular.com/recipes/1421065-556x370.jpeg'
			);
			await expect(time).toBeInTheDocument();
			await expect(servings).toBeInTheDocument();
		});
	}
};
