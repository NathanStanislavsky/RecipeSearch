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