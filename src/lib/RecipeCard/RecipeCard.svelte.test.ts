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
	describe('when not loading', () => {
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

		it('has proper accessibility attributes', () => {
			const card = screen.getByRole('article');
			expect(card).toHaveAttribute('aria-label', `Recipe card for ${recipe.title}`);

			const image = screen.getByRole('img');
			expect(image).toHaveAttribute('alt', `Image of ${recipe.title}`);
			expect(image).toHaveAttribute('loading', 'lazy');
		});

		it('has proper link attributes', () => {
			const link = screen.getByRole('link', { name: /view recipe/i });
			expect(link).toHaveAttribute('target', '_blank');
			expect(link).toHaveAttribute('rel', 'noopener noreferrer');
		});
	});

	describe('when loading', () => {
		beforeEach(() => {
			render(RecipeCard, {
				props: {
					recipe,
					loading: true
				}
			});
		});

		it('shows loading state', () => {
			expect(screen.getByTestId('loading-placeholder')).toHaveClass('animate-pulse');
			expect(screen.queryByRole('img')).not.toBeInTheDocument();
		});

		it('still shows recipe information', () => {
			expect(screen.getByText(recipe.title)).toBeInTheDocument();
			expect(screen.getByText('Ready in')).toBeInTheDocument();
			expect(screen.getByText(`${recipe.readyInMinutes} minutes`)).toBeInTheDocument();
			expect(screen.getByText(`${recipe.servings} servings`)).toBeInTheDocument();
		});
	});
});
