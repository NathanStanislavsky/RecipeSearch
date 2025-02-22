export function extractRecipeIds(recipesData: any[]): {
	recipeIds?: number[];
	errorResponse?: Response;
} {
	const recipeIds = recipesData
		.map((recipe: any) => recipe.id)
		.filter((id) => id !== undefined && id !== null);

	if (recipeIds.length === 0) {
		const response = new Response(
			JSON.stringify({ error: 'No recipes found for the provided ingredients' }),
			{ status: 404 }
		);
		return { errorResponse: response };
	}
	return { recipeIds };
}

export function constructBulkApiURL(recipeIds: number[]): Response | URL {
  if (recipeIds.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Missing or empty required parameter: ids' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const bulkUrl = new URL(
    'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/informationBulk'
  );
  bulkUrl.searchParams.append('ids', recipeIds.join(','));

  return bulkUrl;
}
