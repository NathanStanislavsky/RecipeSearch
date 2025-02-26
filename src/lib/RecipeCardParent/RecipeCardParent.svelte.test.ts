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
	it('renders two recipe cards', () => {
		render(RecipeCardParent, { props: { recipes: mockRecipes } });

		expect(screen.getByText('Chili Stuffed Potatoes')).toBeInTheDocument();
		expect(screen.getByText('Veggie Pasta')).toBeInTheDocument();
	});
});
