import { render, screen } from '@testing-library/svelte';
import { describe, it, beforeEach, expect } from 'vitest';
import RecipeCard from './RecipeCard.svelte';

const recipe = {
  image: "https://img.spoonacular.com/recipes/987-556x370.jpg",
  title: "Sea Bass and Cucumbers in Champagne Sauce",
  readyInMinutes: 15,
  servings: 4,
  sourceUrl: "http://www.myrecipes.com/recipe/sea-bass-cucumbers-champagne-sauce-10000000640888/"
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
    expect(screen.getByRole('link', { name: /view recipe/i })).toHaveAttribute('href', recipe.sourceUrl);
  });
});