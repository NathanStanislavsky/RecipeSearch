import { render, screen, cleanup } from '@testing-library/svelte';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import RecipeCard from './RecipeCard.svelte';
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

describe('RecipeCard', () => {
	afterEach(() => {
		cleanup();
	});

	beforeEach(() => {
		render(RecipeCard, {
			props: {
				recipe: mockRecipe
			}
		});
	});

	it('renders the recipe card with basic information', () => {
		expect(screen.getByRole('article')).toBeInTheDocument();
		expect(screen.getByText('crock pot shredded chicken sandwiches')).toBeInTheDocument();

		// Use more flexible text matching for the minutes
		expect(screen.getByText('125')).toBeInTheDocument();
		expect(screen.getByText('minutes')).toBeInTheDocument();
	});

	it('renders the description section', () => {
		expect(screen.getByText('Description')).toBeInTheDocument();
		expect(screen.getByText(mockRecipe.description)).toBeInTheDocument();
	});

	it('has proper accessibility attributes', () => {
		const card = screen.getByRole('article');
		expect(card).toHaveAttribute('aria-label', `Recipe card for ${mockRecipe.name}`);
	});

	it('applies correct styling classes', () => {
		const card = screen.getByRole('article');
		expect(card).toHaveClass(
			'max-w-sm',
			'overflow-hidden',
			'rounded-lg',
			'bg-white',
			'shadow-lg',
			'transition-transform',
			'hover:scale-105'
		);
	});
});
