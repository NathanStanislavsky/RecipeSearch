import { render, screen, cleanup } from '@testing-library/svelte';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import RecipeDetailView from './RecipeDetailView.svelte';
import type { TransformedRecipe } from '../../types/recipe.js';

const mockRecipe: TransformedRecipe = {
	id: 388939,
	name: 'crock pot shredded chicken sandwiches',
	minutes: 125,
	nutrition: '[792.1, 73.0, 15.0, 46.0, 116.0, 67.0, 9.0]',
	steps:
		'["empty can of chicken into large bowl or even crockpot container , do not drain", "open stuffing and can of cream of chicken , mix with large spoon or use clean hands to break up meat and throughly mix ingredients", "place in crockpot", "cook on medium for approx 2 hours or until warmed thru , stir as needed"]',
	description:
		'fast and easy, tastes great! been at almost every pot-luck in our family for years!',
	ingredients:
		'["boneless chicken", "chicken flavor stuffing mix", "cream of chicken soup", "chicken broth"]',
	score: 1.504440426826477
};

describe('RecipeDetailView', () => {
	afterEach(() => {
		cleanup();
	});

	beforeEach(() => {
		render(RecipeDetailView, {
			props: {
				recipe: mockRecipe
			}
		});
	});

	it('renders nutrition information correctly', () => {
		expect(screen.getByText('Nutrition')).toBeInTheDocument();

		// Check calories (first value in nutrition array)
		expect(screen.getByText('792')).toBeInTheDocument();

		// Check PDV values
		expect(screen.getByText('73% DV')).toBeInTheDocument(); // Total Fat
		expect(screen.getByText('15% DV')).toBeInTheDocument(); // Sugar
		expect(screen.getByText('46% DV')).toBeInTheDocument(); // Sodium
		expect(screen.getByText('116% DV')).toBeInTheDocument(); // Protein
		expect(screen.getByText('67% DV')).toBeInTheDocument(); // Saturated Fat

		// Check labels
		expect(screen.getByText('Calories:')).toBeInTheDocument();
		expect(screen.getByText('Total Fat:')).toBeInTheDocument();
		expect(screen.getByText('Sugar:')).toBeInTheDocument();
		expect(screen.getByText('Sodium:')).toBeInTheDocument();
		expect(screen.getByText('Protein:')).toBeInTheDocument();
		expect(screen.getByText('Sat. Fat:')).toBeInTheDocument();
	});

	it('renders ingredients list correctly', () => {
		expect(screen.getByText('Ingredients')).toBeInTheDocument();

		// Check individual ingredients
		expect(screen.getByText('boneless chicken')).toBeInTheDocument();
		expect(screen.getByText('chicken flavor stuffing mix')).toBeInTheDocument();
		expect(screen.getByText('cream of chicken soup')).toBeInTheDocument();
		expect(screen.getByText('chicken broth')).toBeInTheDocument();
	});

	it('renders instructions correctly', () => {
		expect(screen.getByText('Instructions')).toBeInTheDocument();

		// Check that numbered steps are rendered
		expect(screen.getByText('1')).toBeInTheDocument();
		expect(screen.getByText('2')).toBeInTheDocument();
		expect(screen.getByText('3')).toBeInTheDocument();
		expect(screen.getByText('4')).toBeInTheDocument();

		// Check step content
		expect(screen.getByText(/empty can of chicken into large bowl/)).toBeInTheDocument();
		expect(screen.getByText(/open stuffing and can of cream of chicken/)).toBeInTheDocument();
		expect(screen.getByText(/place in crockpot/)).toBeInTheDocument();
		expect(screen.getByText(/cook on medium for approx 2 hours/)).toBeInTheDocument();
	});
});
