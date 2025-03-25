import { render, fireEvent, screen } from '@testing-library/svelte';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import RecipeCard from './RecipeCard.svelte';

const recipe = {
	id: 123,
	image: 'https://img.spoonacular.com/recipes/987-556x370.jpg',
	title: 'Sea Bass and Cucumbers in Champagne Sauce',
	readyInMinutes: 15,
	servings: 4,
	sourceUrl: 'http://www.myrecipes.com/recipe/sea-bass-cucumbers-champagne-sauce-10000000640888/'
};

const user = {
	userId: 89,
	email: 'test@gmail.com',
	iat: 1742866111,
	exp: 1742869711
};

describe('RecipeCard Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		beforeEach(() => {
			render(RecipeCard, {
				props: {
					recipe,
					user
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

		it('displays the star icon unfilled by default', () => {
			const icon = screen.getByTestId('favorite-icon');
			expect(icon).toBeInTheDocument();

			// Verify that the path of svg is for unfilled star
			const pathElement = icon.querySelector('svg path');
			expect(pathElement).toBeTruthy();
			if (pathElement) {
				expect(pathElement.getAttribute('d')).toContain(
					'm12 15.39l-3.76 2.27l.99-4.28l-3.32-2.88l4.38-.37L12 6.09l1.71 4.04l4.38.37l-3.32 2.88l.99 4.28M22 9.24l-7.19-.61L12 2L9.19 8.63L2 9.24l5.45 4.73L5.82 21L12 17.27L18.18 21l-1.64-7.03L22 9.24Z'
				);
			}
		});
	});

	describe('toggleFavorite Functionality', () => {
		// Helper to locate the toggle button
		const getToggleButton = () => {
			const icon = screen.getByTestId('favorite-icon');
			const button = icon.closest('button');
			if (!button) throw new Error('Toggle button not found');
			return button;
		};

		beforeEach(() => {
			vi.clearAllMocks();
		});

		it('should call POST to add favorite when not already favorited', async () => {
			const fetchMock = vi
				.spyOn(global, 'fetch')
				.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));

			render(RecipeCard, {
				props: {
					recipe,
					user
				}
			});

			const toggleButton = getToggleButton();
			await fireEvent.click(toggleButton);

			expect(fetchMock).toHaveBeenCalledWith('/favorites/addFavorite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: user.userId,
					recipeData: recipe
				})
			});

			fetchMock.mockRestore();
		});

		it('should call DELETE to remove favorite when already favorited', async () => {
			const fetchMock = vi
				.spyOn(global, 'fetch')
				.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));

			render(RecipeCard, {
				props: {
					recipe,
					user
				}
			});

			const toggleButton = getToggleButton();
			// First click adds favorite.
			await fireEvent.click(toggleButton);
			// Second click removes favorite.
			await fireEvent.click(toggleButton);

			expect(fetchMock).toHaveBeenCalledWith('/favorites/deleteFavorite', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: user.userId,
					recipeId: recipe.id
				})
			});

			fetchMock.mockRestore();
		});
	});
});
