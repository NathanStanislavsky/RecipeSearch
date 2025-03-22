import { db } from '$lib/server/db/index.ts';
import { recipes, favorites } from '$lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';

async function addFavorite(
	userId: number,
	recipeData: {
		id: number;
		image: string;
		title: string;
		readyInMinutes: number;
		servings: number;
		sourceUrl: string;
	}
) {
	// Uses a db transaction to ensure both operations succeed together
	return await db.transaction(async (tx) => {
		// Check if the recipe exists
		const existingRecipe = await tx
			.select()
			.from(recipes)
			.where(eq(recipes.id, recipeData.id))
			.then((result) => result[0]);

		// If it doesn't exist, insert it into the recipes table
		if (!existingRecipe) {
			await tx.insert(recipes).values(recipeData);
		}

		// Now insert the relationship in the favorites table
		const result = await tx.insert(favorites).values({
			userId,
			recipeId: recipeData.id
		});
		return result;
	});
}
