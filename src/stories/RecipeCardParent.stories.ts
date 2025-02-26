import type { Meta, StoryObj } from '@storybook/svelte';
import RecipeCardParent from '$lib/RecipeCardParent/RecipeCardParent.svelte';

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
} satisfies Meta<RecipeCardParent>;

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
			},
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
			},
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
			},
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
	}
};
