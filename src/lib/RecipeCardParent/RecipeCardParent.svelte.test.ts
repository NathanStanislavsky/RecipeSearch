import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import RecipeCardParent from './RecipeCardParent.svelte';
import '@testing-library/jest-dom/vitest';

const mockRecipes = [
	{
		image: 'https://img.spoonacular.com/recipes/1421065-556x370.jpeg',
		title: 'Chili Stuffed Potatoes',
		readyInMinutes: 45,
		servings: 1,
		sourceUrl: 'https://fountainavenuekitchen.com/chili-stuffed-potatoes/'
	},
	{
		image: 'https://img.spoonacular.com/recipes/1421065-556x370.jpeg',
		title: 'Veggie Pasta',
		readyInMinutes: 30,
		servings: 2,
		sourceUrl: 'https://example.com/veggie-pasta'
	}
];

describe('RecipeCardParent', () => {
	it('renders two recipe cards with correct titles', () => {
		render(RecipeCardParent, { props: { recipes: mockRecipes } });

		const recipeHeadings = screen.getAllByRole('heading', { level: 2 });

		expect(recipeHeadings).toHaveLength(mockRecipes.length);

		mockRecipes.forEach((recipe) => {
			expect(screen.getByText(recipe.title)).toBeInTheDocument();
		});
	});
});
