import { db } from '$lib/server/db/index.ts';
import { favorites } from '$lib/server/db/schema.ts';
import { eq, and } from 'drizzle-orm';

async function removeFavorite(userId: number, recipeId: number) {
	const result = await db
		.delete(favorites)
		.where(and(eq(favorites.userId, userId), eq(favorites.recipeId, recipeId)));
	return result;
}
