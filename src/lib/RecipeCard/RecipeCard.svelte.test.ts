import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, beforeEach, expect } from 'vitest';
import RecipeCard from './RecipeCard.svelte';

const recipe = {
	id: '987',
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

		it('applies correct styling to the card', () => {
			const card = screen.getByRole('article');
			expect(card).toHaveClass(
				'max-w-sm',
				'overflow-hidden',
				'rounded',
				'bg-white',
				'shadow-lg',
				'transition-transform',
				'hover:scale-105'
			);
		});

		it('applies correct styling to the image', () => {
			const image = screen.getByRole('img');
			expect(image).toHaveClass('h-48', 'w-full', 'object-cover');
		});

		it('applies correct styling to the link', () => {
			const link = screen.getByRole('link', { name: /view recipe/i });
			expect(link).toHaveClass(
				'block',
				'rounded',
				'bg-blue-500',
				'px-4',
				'py-2',
				'text-center',
				'font-bold',
				'text-white',
				'transition-colors',
				'hover:bg-blue-700',
				'focus:ring-2',
				'focus:ring-blue-500',
				'focus:ring-offset-2',
				'focus:outline-none'
			);
		});

		it('handles image loading error', async () => {
			const image = screen.getByRole('img');
			await fireEvent.error(image);
			expect(image).toHaveAttribute('src', recipe.image);
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

		it('applies correct styling to the loading placeholder', () => {
			const placeholder = screen.getByTestId('loading-placeholder');
			expect(placeholder).toHaveClass('h-48', 'w-full', 'animate-pulse', 'bg-gray-200');
		});
	});

	describe('interaction states', () => {
		beforeEach(() => {
			render(RecipeCard, {
				props: {
					recipe
				}
			});
		});

		it('applies hover effect to the card', () => {
			const card = screen.getByRole('article');
			expect(card).toHaveClass('hover:scale-105');
		});

		it('applies hover effect to the link', () => {
			const link = screen.getByRole('link', { name: /view recipe/i });
			expect(link).toHaveClass('hover:bg-blue-700');
		});

		it('applies focus styles to the link', () => {
			const link = screen.getByRole('link', { name: /view recipe/i });
			expect(link).toHaveClass(
				'focus:ring-2',
				'focus:ring-blue-500',
				'focus:ring-offset-2',
				'focus:outline-none'
			);
		});
	});
});
