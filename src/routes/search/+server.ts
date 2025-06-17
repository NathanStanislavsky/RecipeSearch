import type { RequestHandler } from '@sveltejs/kit';
import {
	extractRecipeIds,
	constructBulkApiURL,
	fetchBulkRecipeInformation,
	filterInformationBulkReponse
} from '$utils/search/recipeByIDs/recipeByIDUtils.js';
import {
	parseIngredients,
	fetchRecipeByIngredients,
	constructApiUrl
} from '$utils/search/recipeByIngredients/recipeByIngredientsUtils.js';
import { createJsonResponse } from '$utils/api/apiUtils.js';
import { ApiError, handleError } from '$utils/errors/AppError.js';
import { db } from '$lib/server/db/index.js';
import { ingredientSearches, recipes } from '$lib/server/db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import type { RecipeResponse } from '../../types/recipe.ts';

async function getCachedRecipeIds(ingredients: string) {
	const recipeIds = await db
		.select()
		.from(ingredientSearches)
		.where(eq(ingredientSearches.ingredients, ingredients));
	return recipeIds;
}

async function cacheIngredientSearch(ingredients: string, recipeIds: number[]) {
	await db.insert(ingredientSearches).values({
		ingredients,
		recipeIds: recipeIds.join(',')
	});
}

async function getRecipesFromDb(recipeIds: number[]) {
	const cachedRecipes = await db.select().from(recipes).where(inArray(recipes.id, recipeIds));
	return cachedRecipes;
}

async function cacheRecipes(recipesToSave: RecipeResponse[]): Promise<void> {
    const existingRecipes = await getRecipesFromDb(recipesToSave.map(recipe => recipe.id));
    const existingIds = new Set(existingRecipes.map(recipe => recipe.id));
    
    const newRecipes = recipesToSave.filter(recipe => !existingIds.has(recipe.id));
    
    if (newRecipes.length > 0) {
        await db.insert(recipes).values(newRecipes);
    }
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		const ingredientsOrResponse = parseIngredients(url);
		if (ingredientsOrResponse instanceof Response) {
			return ingredientsOrResponse;
		}
		const ingredients = ingredientsOrResponse;

		const cachedRecipeIds = await getCachedRecipeIds(ingredients);
		let recipeIds: number[] = [];

		if (cachedRecipeIds) {
			recipeIds = cachedRecipeIds.map((recipe) => parseInt(recipe.recipeIds));
		} else {
			const recipeByIngredientsUrl = constructApiUrl(ingredients);

			const ingredientSearchResponse = await fetchRecipeByIngredients(recipeByIngredientsUrl);
			if (!ingredientSearchResponse.ok) {
				throw new ApiError(
					'Failed to fetch recipes by ingredients',
					ingredientSearchResponse.status
				);
			}

			const recipesData = await ingredientSearchResponse.json();
			const { recipeIds: newRecipeIds, errorResponse } = extractRecipeIds(recipesData);

			if (errorResponse) {
				return errorResponse;
			}

			if (!newRecipeIds || newRecipeIds.length === 0) {
				return createJsonResponse([], 200);
			}

			recipeIds = newRecipeIds;

			await cacheIngredientSearch(ingredients, recipeIds);
		}

		const cachedRecipes = await getRecipesFromDb(recipeIds);

		if (cachedRecipes.length === recipeIds.length) {
			return createJsonResponse(cachedRecipes, 200);
		}

		const missingRecipeIds = recipeIds.filter(
			(id) => !cachedRecipes.some((recipe) => recipe.id === id)
		);


        let finalRecipes = [...cachedRecipes];

        if (missingRecipeIds.length > 0) {
            const bulkApiUrlResponse = constructBulkApiURL(missingRecipeIds);
            const bulkApiUrl = bulkApiUrlResponse as URL;

            const bulkResponse = await fetchBulkRecipeInformation(bulkApiUrl);
            if (!bulkResponse.ok) {
                throw new ApiError('Failed to fetch detailed recipe information', bulkResponse.status);
            }

            const missingRecipesResponse = await filterInformationBulkReponse(bulkResponse);
            const missingRecipes = await missingRecipesResponse.json();

            await cacheRecipes(missingRecipes);
            finalRecipes = [...finalRecipes, ...missingRecipes];
        }

        return createJsonResponse(finalRecipes, 200);
	} catch (error) {
		const errorResponse = handleError(error, 'Recipe Search');
		return createJsonResponse(
			{
				error: errorResponse.error,
				message: errorResponse.message
			},
			errorResponse.status
		);
	}
};
