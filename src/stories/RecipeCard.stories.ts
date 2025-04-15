import type { Meta, StoryObj } from '@storybook/svelte';
import RecipeCard from '$lib/RecipeCard/RecipeCard.svelte';
import { expect, within, waitFor } from '@storybook/test';
import type { Recipe } from '../types/recipe.js';

interface RecipeCardProps {
	recipe: Recipe;
}

const meta = {
	title: 'Components/RecipeCard',
	component: RecipeCard,
	tags: ['autodocs'],
	argTypes: {
		recipe: {
			control: 'object',
			description: 'Recipe object containing image, title, readyInMinutes, servings, and sourceUrl'
		}
	},
	args: {
		recipe: {
			image: 'https://img.spoonacular.com/recipes/987-556x370.jpg',
			title: 'Sea Bass and Cucumbers in Champagne Sauce',
			readyInMinutes: 15,
			servings: 4,
			sourceUrl:
				'http://www.myrecipes.com/recipe/sea-bass-cucumbers-champagne-sauce-10000000640888/'
		}
	}
} satisfies Meta<RecipeCardProps>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default state: basic recipe card display
export const Default: Story = {
	args: {
		recipe: {
			image: 'https://img.spoonacular.com/recipes/987-556x370.jpg',
			title: 'Sea Bass and Cucumbers in Champagne Sauce',
			readyInMinutes: 15,
			servings: 4,
			sourceUrl:
				'http://www.myrecipes.com/recipe/sea-bass-cucumbers-champagne-sauce-10000000640888/'
		}
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const title = canvas.getByText('Sea Bass and Cucumbers in Champagne Sauce');
		const image = canvas.getByRole('img');
		// Use a regex matcher to allow flexible matching for "15 min"
		const time = canvas.getByText(/15\s*min/i);
		const servings = canvas.getByText('4 servings');

		await expect(title).toBeInTheDocument();
		await expect(image).toHaveAttribute(
			'src',
			'https://img.spoonacular.com/recipes/987-556x370.jpg'
		);
		await expect(time).toBeInTheDocument();
		await expect(servings).toBeInTheDocument();
	}
};

// Interactive state: verify title and source link exist on the card
export const Interactive: Story = {
	args: {
		recipe: {
			image: 'https://img.spoonacular.com/recipes/987-556x370.jpg',
			title: 'Sea Bass and Cucumbers in Champagne Sauce',
			readyInMinutes: 15,
			servings: 4,
			sourceUrl:
				'http://www.myrecipes.com/recipe/sea-bass-cucumbers-champagne-sauce-10000000640888/'
		}
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const titleElement = canvas.getByText('Sea Bass and Cucumbers in Champagne Sauce');
		const linkElement = canvas.getByRole('link', { name: /view recipe/i });

		await waitFor(() => expect(titleElement).toBeInTheDocument());
		await waitFor(() =>
			expect(linkElement).toHaveAttribute(
				'href',
				'http://www.myrecipes.com/recipe/sea-bass-cucumbers-champagne-sauce-10000000640888/'
			)
		);
	}
};
