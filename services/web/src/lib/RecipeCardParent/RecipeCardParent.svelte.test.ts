import { render, screen, cleanup } from '@testing-library/svelte';
import { describe, it, expect, afterEach } from 'vitest';
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
		score: 1.504440426826477,
		userRating: undefined
	},
	{
		id: 567234,
		name: 'easy pasta carbonara',
		minutes: 30,
		nutrition: '[450.2, 35.0, 8.0, 25.0, 80.0, 45.0, 12.0]',
		steps: '["boil pasta", "cook bacon", "mix eggs and cheese", "combine all ingredients"]',
		description: 'classic italian pasta dish with creamy sauce',
		ingredients: '["pasta", "bacon", "eggs", "parmesan cheese", "black pepper"]',
		score: 2.1234567,
		userRating: 4
	},
	{
		id: 123456,
		name: 'chocolate chip cookies',
		minutes: 45,
		nutrition: '[280.5, 45.0, 60.0, 15.0, 25.0, 55.0, 35.0]',
		steps:
			'["cream butter and sugar", "add eggs and vanilla", "mix in flour", "add chocolate chips", "bake for 12 minutes"]',
		description: 'soft and chewy homemade chocolate chip cookies',
		ingredients: '["flour", "butter", "sugar", "eggs", "vanilla", "chocolate chips"]',
		score: 1.87654321,
		userRating: 5
	}
];

describe('RecipeCardParent', () => {
	afterEach(() => {
		cleanup();
	});

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
				// Check for the individual components instead of the combined text
				expect(screen.getByText(recipe.minutes.toString())).toBeInTheDocument();
			});

			// Also check that "minutes" text appears (should be multiple times)
			const minutesTexts = screen.getAllByText('minutes');
			expect(minutesTexts.length).toBe(mockRecipes.length);
		});

		it('renders recipe descriptions', () => {
			render(RecipeCardParent, { props: { recipes: mockRecipes } });

			mockRecipes.forEach((recipe) => {
				expect(screen.getByText(recipe.description)).toBeInTheDocument();
			});
		});

		it('renders "View Recipe Details" buttons for all recipes', () => {
			render(RecipeCardParent, { props: { recipes: mockRecipes } });

			const detailButtons = screen.getAllByText('View Recipe Details');
			expect(detailButtons).toHaveLength(mockRecipes.length);

			detailButtons.forEach((button) => {
				expect(button).toBeInTheDocument();
				expect(button.tagName).toBe('BUTTON');
			});
		});

		it('renders rating stars for all recipes', () => {
			render(RecipeCardParent, { props: { recipes: mockRecipes } });

			// Check that rating buttons are present for each recipe
			const ratingButtons = screen.getAllByRole('button', { name: /Rate \d+ stars/ });
			expect(ratingButtons.length).toBeGreaterThan(0);

			// Each recipe should have 5 rating buttons (1-5 stars)
			expect(ratingButtons.length).toBe(mockRecipes.length * 5);
		});

		it('renders description section with proper heading', () => {
			render(RecipeCardParent, { props: { recipes: mockRecipes } });

			// Check that description headings are present
			const descriptionHeadings = screen.getAllByText('Description');
			expect(descriptionHeadings).toHaveLength(mockRecipes.length);
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
				expect(card).toHaveClass(
					'max-w-sm',
					'overflow-hidden',
					'rounded-lg',
					'bg-white',
					'shadow-lg'
				);
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
			expect(screen.getByText(singleRecipe[0].minutes.toString())).toBeInTheDocument();
			expect(screen.getByText('minutes')).toBeInTheDocument();
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
				score: 1.0,
				userRating: undefined
			};

			render(RecipeCardParent, { props: { recipes: [minimalRecipe] } });

			expect(screen.getByText(minimalRecipe.name)).toBeInTheDocument();
			expect(screen.getByText(minimalRecipe.minutes.toString())).toBeInTheDocument();
			expect(screen.getByText('minutes')).toBeInTheDocument();
			expect(screen.getByText(minimalRecipe.description)).toBeInTheDocument();
			expect(screen.getByText('View Recipe Details')).toBeInTheDocument();
			expect(screen.getByRole('article')).toBeInTheDocument();
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
				score: 0.5,
				userRating: undefined
			};

			render(RecipeCardParent, { props: { recipes: [recipeWithBadData] } });

			// Should still render without crashing
			expect(screen.getByText(recipeWithBadData.name)).toBeInTheDocument();
			expect(screen.getByText(recipeWithBadData.description)).toBeInTheDocument();
			expect(screen.getByRole('article')).toBeInTheDocument();
		});

		it('handles recipes with userRating set', () => {
			const ratedRecipe: TransformedRecipe = {
				id: 777777,
				name: 'rated recipe',
				minutes: 25,
				nutrition: '[300, 20, 10, 15, 25, 18, 30]',
				steps: '["step 1", "step 2", "step 3"]',
				description: 'recipe with user rating',
				ingredients: '["ingredient 1", "ingredient 2", "ingredient 3"]',
				score: 2.5,
				userRating: 3
			};

			render(RecipeCardParent, { props: { recipes: [ratedRecipe] } });

			expect(screen.getByText(ratedRecipe.name)).toBeInTheDocument();
			expect(screen.getByText(ratedRecipe.description)).toBeInTheDocument();
			expect(screen.getByRole('article')).toBeInTheDocument();

			const ratingButtons = screen.getAllByRole('button', { name: /Rate \d+ stars/ });
			expect(ratingButtons).toHaveLength(5);
		});
	});
});
