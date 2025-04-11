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
		});
	});

	it('renders recipe cards with correct cooking time and servings', () => {
		render(RecipeCardParent, { props: { recipes: mockRecipes } });

		mockRecipes.forEach((recipe) => {
			const cookingTimeText = screen.getByText((content, element) => {
				return element?.textContent === `Ready in ${recipe.readyInMinutes} minutes`;
			});
			expect(cookingTimeText).toBeInTheDocument();

			const minutesSpan = screen.getByText(`${recipe.readyInMinutes} minutes`);
			expect(minutesSpan).toHaveClass('font-semibold');

			expect(screen.getByText(`${recipe.servings} servings`)).toBeInTheDocument();
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
		});
	});

	it('applies correct grid layout classes', () => {
		const { container } = render(RecipeCardParent, { props: { recipes: mockRecipes } });

		const gridContainer = container.firstChild as HTMLElement;
		expect(gridContainer).toHaveClass('grid');
		expect(gridContainer).toHaveClass('grid-cols-1');
		expect(gridContainer).toHaveClass('sm:grid-cols-2');
		expect(gridContainer).toHaveClass('lg:grid-cols-3');
		expect(gridContainer).toHaveClass('gap-4');
	});

	it('handles empty recipes array gracefully', () => {
		render(RecipeCardParent, { props: { recipes: [] } });

		const recipeHeadings = screen.queryAllByRole('heading', { level: 2 });
		expect(recipeHeadings).toHaveLength(0);
	});
});
