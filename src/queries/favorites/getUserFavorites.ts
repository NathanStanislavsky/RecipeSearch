import { db } from '$lib/server/db/index.ts';
import { recipes, favorites } from '$lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';

export async function getUserFavorites(userId: number) {
	const favoriteRecipes = await db
		.select({
			recipeId: recipes.id,
			title: recipes.title,
			image: recipes.image,
			readyInMinutes: recipes.readyInMinutes,
			servings: recipes.servings,
			sourceUrl: recipes.sourceUrl
		})
		.from(favorites)
		.innerJoin(recipes, eq(favorites.recipeId, recipes.id))
		.where(eq(favorites.userId, userId));
	return favoriteRecipes;
}
