import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import RecipeCardParent from './RecipeCardParent.svelte';
import { TestHelper } from '$utils/test/testHelper.ts';
import '@testing-library/jest-dom/vitest';

// Create mock recipes with varying data
const mockRecipes = Array.from({ length: 3 }, (_, i) => TestHelper.createMockRecipe(i));

describe('RecipeCardParent', () => {
	describe('rendering', () => {
		it('renders recipe cards with correct titles', () => {
			render(RecipeCardParent, { props: { recipes: mockRecipes } });

			const recipeHeadings = screen.getAllByRole('heading', { level: 2 });
			expect(recipeHeadings).toHaveLength(mockRecipes.length);

			mockRecipes.forEach((recipe) => {
				expect(screen.getByText(recipe.title)).toBeInTheDocument();
			});
		});

		it('renders recipe cards with correct images', () => {
			render(RecipeCardParent, { props: { recipes: mockRecipes } });

			const images = screen.getAllByRole('img');
			expect(images).toHaveLength(mockRecipes.length);

			images.forEach((img, index) => {
				expect(img).toHaveAttribute('src', mockRecipes[index].image);
				expect(img).toHaveAttribute('alt', `Image of ${mockRecipes[index].title}`);
				expect(img).toHaveAttribute('loading', 'lazy');
			});
		});

		it('renders recipe cards with correct cooking time and servings', () => {
			render(RecipeCardParent, { props: { recipes: mockRecipes } });

			mockRecipes.forEach((recipe) => {
				const cookingTimeElements = screen.getAllByText((content, element) => {
					return element?.textContent === `Ready in ${recipe.readyInMinutes} minutes`;
				});
				expect(cookingTimeElements.length).toBeGreaterThan(0);

				const minutesSpan = screen.getAllByText(`${recipe.readyInMinutes} minutes`);
				expect(minutesSpan.length).toBeGreaterThan(0);
				minutesSpan.forEach((span) => {
					expect(span).toHaveClass('font-semibold');
				});

				expect(screen.getAllByText(`${recipe.servings} servings`).length).toBeGreaterThan(0);
			});
		});

		it('renders recipe cards with correct source links', () => {
			render(RecipeCardParent, { props: { recipes: mockRecipes } });

			const links = screen.getAllByRole('link');
			expect(links).toHaveLength(mockRecipes.length);

			links.forEach((link, index) => {
				expect(link).toHaveAttribute('href', mockRecipes[index].sourceUrl);
				expect(link).toHaveAttribute('target', '_blank');
				expect(link).toHaveAttribute('rel', 'noopener noreferrer');
				expect(link).toHaveTextContent('View Recipe');
				expect(link).toHaveAttribute('aria-label', `View recipe for ${mockRecipes[index].title}`);
			});
		});
	});

	describe('layout and styling', () => {
		it('applies correct grid layout classes', () => {
			const { container } = render(RecipeCardParent, { props: { recipes: mockRecipes } });

			const gridContainer = container.firstChild as HTMLElement;
			expect(gridContainer).toHaveClass('grid');
			expect(gridContainer).toHaveClass('grid-cols-1');
			expect(gridContainer).toHaveClass('sm:grid-cols-2');
			expect(gridContainer).toHaveClass('lg:grid-cols-3');
			expect(gridContainer).toHaveClass('gap-4');
		});

		it('applies correct card styling', () => {
			render(RecipeCardParent, { props: { recipes: mockRecipes } });

			const cards = screen.getAllByRole('article');
			cards.forEach((card) => {
				expect(card).toHaveClass('max-w-sm', 'overflow-hidden', 'rounded', 'bg-white', 'shadow-lg');
				expect(card).toHaveClass('transition-transform', 'hover:scale-105');
			});
		});
	});

	describe('edge cases', () => {
		it('handles empty recipes array gracefully', () => {
			render(RecipeCardParent, { props: { recipes: [] } });

			const recipeHeadings = screen.queryAllByRole('heading', { level: 2 });
			expect(recipeHeadings).toHaveLength(0);
			expect(screen.queryByRole('img')).not.toBeInTheDocument();
			expect(screen.queryByRole('link')).not.toBeInTheDocument();
		});

		it('handles single recipe correctly', () => {
			const singleRecipe = [mockRecipes[0]];
			render(RecipeCardParent, { props: { recipes: singleRecipe } });

			expect(screen.getByText(singleRecipe[0].title)).toBeInTheDocument();
			expect(screen.getAllByRole('img')).toHaveLength(1);
			expect(screen.getAllByRole('link')).toHaveLength(1);
		});

		it('handles recipes with missing optional fields', () => {
			const incompleteRecipe = {
				id: '123',
				title: 'Incomplete Recipe',
				image: 'https://example.com/recipe.jpg',
				readyInMinutes: 30,
				servings: 2,
				sourceUrl: 'https://example.com/incomplete'
			};
			render(RecipeCardParent, { props: { recipes: [incompleteRecipe] } });

			expect(screen.getByText(incompleteRecipe.title)).toBeInTheDocument();
			expect(
				screen.getAllByText(`${incompleteRecipe.readyInMinutes} minutes`).length
			).toBeGreaterThan(0);
			expect(screen.getAllByText(`${incompleteRecipe.servings} servings`).length).toBeGreaterThan(
				0
			);
			expect(screen.getByRole('link')).toHaveAttribute('href', incompleteRecipe.sourceUrl);
		});
	});
});
