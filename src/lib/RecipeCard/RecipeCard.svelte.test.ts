import { render, screen } from '@testing-library/svelte';
import { describe, it, beforeEach, expect } from 'vitest';
import RecipeCard from './RecipeCard.svelte';

const recipe = {
	image: 'https://img.spoonacular.com/recipes/987-556x370.jpg',
	title: 'Sea Bass and Cucumbers in Champagne Sauce',
	readyInMinutes: 15,
	servings: 4,
	sourceUrl: 'http://www.myrecipes.com/recipe/sea-bass-cucumbers-champagne-sauce-10000000640888/'
};

describe('RecipeCard', () => {
	beforeEach(() => {
		render(RecipeCard, {
			props: {
				recipe
			}
		});
	});

	it('renders the recipe card with all elements', () => {
		expect(screen.getByRole('img')).toHaveAttribute('src', recipe.image);
		expect(screen.getByText(recipe.title)).toBeInTheDocument();
		expect(screen.getByText('Ready in')).toBeInTheDocument();
		expect(screen.getByText(`${recipe.readyInMinutes} minutes`)).toBeInTheDocument();
		expect(screen.getByText(`${recipe.servings} servings`)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /view recipe/i })).toHaveAttribute(
			'href',
			recipe.sourceUrl
		);
	});

	it('Star exists and is unfilled by default', () => {
		// Find the star button
		const starButton = screen.getByRole('button');
		expect(starButton).toBeInTheDocument();

		// Find the icon via its test id
		const icon = screen.getByTestId('favorite-icon');
		expect(icon).toBeInTheDocument();

		// Query for the <path> element within the SVG
		const pathElement = icon.querySelector('svg path');
		expect(pathElement).toBeTruthy();
		if (pathElement) {
			expect(pathElement.getAttribute('d')).toContain(
				'm12 15.39l-3.76 2.27l.99-4.28l-3.32-2.88l4.38-.37L12 6.09l1.71 4.04l4.38.37l-3.32 2.88l.99 4.28M22 9.24l-7.19-.61L12 2L9.19 8.63L2 9.24l5.45 4.73L5.82 21L12 17.27L18.18 21l-1.64-7.03L22 9.24Z'
			);
		}
	});
});
