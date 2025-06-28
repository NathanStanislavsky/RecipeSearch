import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import RecipeCardParent from './RecipeCardParent.svelte';
import type { TransformedRecipe } from '../../types/recipe.js';
import '@testing-library/jest-dom/vitest';

// Create mock recipes with varying data
const mockRecipes: TransformedRecipe[] = [
	{
		id: 388939,
		name: 'crock pot shredded chicken sandwiches',
		minutes: 125,
		nutrition: '[792.1, 73.0, 15.0, 46.0, 116.0, 67.0, 9.0]',
		steps: '["empty can of chicken into large bowl", "mix with large spoon", "place in crockpot"]',
		description: 'fast and easy, tastes great!',
		ingredients: '["boneless chicken", "chicken flavor stuffing mix", "cream of chicken soup"]',
		score: 1.504440426826477
	},
	{
		id: 567234,
		name: 'easy pasta carbonara',
		minutes: 30,
		nutrition: '[450.2, 35.0, 8.0, 25.0, 80.0, 45.0, 12.0]',
		steps: '["boil pasta", "cook bacon", "mix eggs and cheese", "combine all ingredients"]',
		description: 'classic italian pasta dish with creamy sauce',
		ingredients: '["pasta", "bacon", "eggs", "parmesan cheese", "black pepper"]',
		score: 2.1234567
	},
	{
		id: 123456,
		name: 'chocolate chip cookies',
		minutes: 45,
		nutrition: '[280.5, 45.0, 60.0, 15.0, 25.0, 55.0, 35.0]',
		steps: '["cream butter and sugar", "add eggs and vanilla", "mix in flour", "add chocolate chips", "bake for 12 minutes"]',
		description: 'soft and chewy homemade chocolate chip cookies',
		ingredients: '["flour", "butter", "sugar", "eggs", "vanilla", "chocolate chips"]',
		score: 1.87654321
	}
];

describe('RecipeCardParent', () => {
	describe('rendering', () => {
		it('renders recipe cards with correct names', () => {
			render(RecipeCardParent, { props: { recipes: mockRecipes } });

			const recipeHeadings = screen.getAllByRole('heading', { level: 2 });
			expect(recipeHeadings).toHaveLength(mockRecipes.length);

			mockRecipes.forEach((recipe) => {
				expect(screen.getByText(recipe.name)).toBeInTheDocument();
			});
		});

		it('renders recipe cards with correct cooking times', () => {
			render(RecipeCardParent, { props: { recipes: mockRecipes } });

			mockRecipes.forEach((recipe) => {
				expect(screen.getByText(`${recipe.minutes} minutes`)).toBeInTheDocument();
			});
		});

		it('renders recipe descriptions', () => {
			render(RecipeCardParent, { props: { recipes: mockRecipes } });

			mockRecipes.forEach((recipe) => {
				expect(screen.getByText(recipe.description)).toBeInTheDocument();
			});
		});

		it('renders nutrition information for all recipes', () => {
			render(RecipeCardParent, { props: { recipes: mockRecipes } });

			// Check that nutrition labels are present (one for each recipe)
			const nutritionHeadings = screen.getAllByText('Nutrition');
			expect(nutritionHeadings).toHaveLength(mockRecipes.length);
			
			// Check that calories are displayed for each recipe
			expect(screen.getByText('792')).toBeInTheDocument(); // First recipe calories
			expect(screen.getByText('450')).toBeInTheDocument(); // Second recipe calories
			expect(screen.getByText('281')).toBeInTheDocument(); // Third recipe calories (rounded)
		});

		it('renders ingredients for all recipes', () => {
			render(RecipeCardParent, { props: { recipes: mockRecipes } });

			// Check that ingredients headings are present
			const ingredientsHeadings = screen.getAllByText('Ingredients');
			expect(ingredientsHeadings).toHaveLength(mockRecipes.length);
			
			// Check some specific ingredients
			expect(screen.getByText('boneless chicken')).toBeInTheDocument();
			expect(screen.getByText('pasta')).toBeInTheDocument();
			expect(screen.getByText('chocolate chips')).toBeInTheDocument();
		});

		it('renders instructions for all recipes', () => {
			render(RecipeCardParent, { props: { recipes: mockRecipes } });

			// Check that instructions headings are present
			const instructionsHeadings = screen.getAllByText('Instructions');
			expect(instructionsHeadings).toHaveLength(mockRecipes.length);
			
			// Check that step numbers are rendered
			const stepNumbers = screen.getAllByText('1');
			expect(stepNumbers.length).toBeGreaterThanOrEqual(mockRecipes.length);
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
			expect(cards).toHaveLength(mockRecipes.length);
			
			cards.forEach((card) => {
				expect(card).toHaveClass('max-w-sm', 'overflow-hidden', 'rounded-lg', 'bg-white', 'shadow-lg');
				expect(card).toHaveClass('transition-transform', 'hover:scale-105');
			});
		});
	});

	describe('edge cases', () => {
		it('handles empty recipes array gracefully', () => {
			render(RecipeCardParent, { props: { recipes: [] } });

			const recipeHeadings = screen.queryAllByRole('heading', { level: 2 });
			expect(recipeHeadings).toHaveLength(0);
			expect(screen.queryByRole('article')).not.toBeInTheDocument();
		});

		it('handles single recipe correctly', () => {
			const singleRecipe = [mockRecipes[0]];
			render(RecipeCardParent, { props: { recipes: singleRecipe } });

			expect(screen.getByText(singleRecipe[0].name)).toBeInTheDocument();
			expect(screen.getByText(`${singleRecipe[0].minutes} minutes`)).toBeInTheDocument();
			expect(screen.getAllByRole('article')).toHaveLength(1);
		});

		it('handles recipes with minimal data', () => {
			const minimalRecipe: TransformedRecipe = {
				id: 999999,
				name: 'minimal recipe',
				minutes: 15,
				nutrition: '[200, 10, 5, 8, 15, 12, 20]',
				steps: '["step 1", "step 2"]',
				description: 'simple recipe',
				ingredients: '["ingredient 1", "ingredient 2"]',
				score: 1.0
			};
			
			render(RecipeCardParent, { props: { recipes: [minimalRecipe] } });

			expect(screen.getByText(minimalRecipe.name)).toBeInTheDocument();
			expect(screen.getByText(`${minimalRecipe.minutes} minutes`)).toBeInTheDocument();
			expect(screen.getByText(minimalRecipe.description)).toBeInTheDocument();
			expect(screen.getByText('ingredient 1')).toBeInTheDocument();
			expect(screen.getByText('ingredient 2')).toBeInTheDocument();
		});

		it('handles malformed JSON in recipe data gracefully', () => {
			const recipeWithBadData: TransformedRecipe = {
				id: 888888,
				name: 'recipe with bad data',
				minutes: 20,
				nutrition: 'invalid json',
				steps: 'invalid json',
				ingredients: 'invalid json',
				description: 'recipe with malformed json data',
				score: 0.5
			};
			
			render(RecipeCardParent, { props: { recipes: [recipeWithBadData] } });

			// Should still render without crashing
			expect(screen.getByText(recipeWithBadData.name)).toBeInTheDocument();
			expect(screen.getByText(recipeWithBadData.description)).toBeInTheDocument();
			expect(screen.getByRole('article')).toBeInTheDocument();
		});
	});
});
