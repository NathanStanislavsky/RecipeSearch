import { fail, type Actions } from '@sveltejs/kit';
import { handleError } from '$utils/errors/AppError.js';
import { RecipeService } from '../../data/services/RecipeService.js';

const recipeService = new RecipeService();

export const actions: Actions = {
	search: async ({ request, locals }) => {
		try {
			const formData = await request.formData();
			const query = formData.get('ingredients')?.toString();

			if (!query) {
				return fail(400, { message: 'Search query is required' });
			}

			const result = await recipeService.searchRecipesWithUserRatings(query, locals.user?.id, {
				limit: 50
			});

			return {
				results: result.recipes,
				total: result.total,
				query: result.query
			};
		} catch (error) {
			const errorResponse = handleError(error, 'Ingredient Search');
			return fail(errorResponse.status, { message: errorResponse.message });
		}
	},
	addRating: async ({ request, locals }) => {
		try {
			const formData = await request.formData();
			const recipe_id = formData.get('recipe_id')?.toString();
			const rating = formData.get('rating');

			if (!recipe_id || !rating) {
				return fail(400, { message: 'Recipe ID and rating are required' });
			}

			const user_id = locals.user?.id;
			if (!user_id) {
				return fail(401, { message: 'User not authenticated' });
			}

			const result = await recipeService.rateRecipe(user_id, Number(recipe_id), Number(rating));

			return {
				message: result.upserted ? 'Rating created' : 'Rating updated',
				recipe_id,
				rating: result.rating,
				upserted: result.upserted
			};
		} catch (error) {
			const errorResponse = handleError(error, 'Add Rating');
			return fail(errorResponse.status, { message: errorResponse.message });
		}
	}
};
