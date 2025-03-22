import { db } from '$lib/server/db/index.ts';
import { favorites } from '$lib/server/db/schema.ts';

async function addFavorite(userId: number, recipeId: number) {
	const result = await db.insert(favorites).values({ userId, recipeId });
	return result;
}
