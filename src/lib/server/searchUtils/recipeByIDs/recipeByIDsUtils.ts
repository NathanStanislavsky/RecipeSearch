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

export function parseIDs(url: URL): Response | string {
	const ids = url.searchParams.get('ids');
  
	if (!ids) {
	  return new Response(
		JSON.stringify({ error: 'Missing required parameter: ids' }),
		{
		  status: 400,
		  headers: { 'Content-Type': 'application/json' }
		}
	  );
	}
  
	return ids;
  }