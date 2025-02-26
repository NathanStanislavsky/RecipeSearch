import type { Meta, StoryObj } from '@storybook/svelte';
import RecipeCard from '$lib/RecipeCard/RecipeCard.svelte';
import { expect, within, waitFor } from '@storybook/test';

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
} satisfies Meta<RecipeCard>;

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
		await waitFor(() => expect(titleElement).toBeInTheDocument());
		const linkElement = canvas.getByRole('link', { name: /view recipe/i });
		await waitFor(() =>
			expect(linkElement).toHaveAttribute(
				'href',
				'http://www.myrecipes.com/recipe/sea-bass-cucumbers-champagne-sauce-10000000640888/'
			)
		);
	}
};
