import type { PageServerLoad } from './$types.js';
import type { Actions } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { Storage } from '@google-cloud/storage';
import { GCS_BUCKET_NAME, RECOMMEND_URL } from '$env/static/private';
import { handleError } from '$utils/errors/AppError.js';
import { GoogleAuth } from 'google-auth-library';
import { RecipeService } from '../../data/services/RecipeService.js';

const recipeService = new RecipeService();

// Helper to load the JSON credentials from the base64 environment variable
function loadServiceAccountCredentials() {
	const b64 = process.env.SERVICE_ACCOUNT_KEY;
	if (!b64) return null;
	try {
		const jsonKey = Buffer.from(b64, 'base64').toString('utf8');
		return JSON.parse(jsonKey);
	} catch (e) {
		console.error('Failed to parse SERVICE_ACCOUNT_KEY:', e);
		return null;
	}
}

function getAuthClient() {
	const creds = loadServiceAccountCredentials();
	if (creds) {
		return new GoogleAuth({
			credentials: creds,
			clientOptions: { subject: creds.client_email }
		});
	}
	return new GoogleAuth();
}

function getStorageClient() {
	const creds = loadServiceAccountCredentials();
	if (creds) {
		return new Storage({
			credentials: creds,
			projectId: creds.project_id
		});
	}
	return new Storage();
}

async function getUserEmbedding(userId: string): Promise<number[] | null> {
	try {
		const storage = getStorageClient();
		const bucket = storage.bucket(GCS_BUCKET_NAME);
		const userFileBlob = bucket.file(`user_embeddings/${userId}.json`);
		const [userFile] = await userFileBlob.download();
		return JSON.parse(userFile.toString('utf8'));
	} catch (error) {
		console.error(`Error fetching user embedding for ${userId}:`, error);
		return null;
	}
}

// This function is now handled by RecipeService.getRecipesByIdsWithUserRatings

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return { recommendations: [] };
	}
	try {
		const user_embedding = await getUserEmbedding(locals.user.id.toString());
		if (!user_embedding) {
			return { recommendations: [] };
		}
		const auth = getAuthClient();
		const client = await auth.getIdTokenClient(RECOMMEND_URL);

		const response = await client.request<{ recipe_ids: number[] }>({
			url: `${RECOMMEND_URL}/recommend`,
			method: 'POST',
			data: { user_embedding },
			headers: { 'Content-Type': 'application/json' }
		});
		const data = response.data;

		const recommendations = await recipeService.getRecipesByIdsWithUserRatings(
			data.recipe_ids,
			locals.user.id
		);
		return { recommendations };
	} catch (error) {
		console.error('Error getting recommendations:', error);
		return { recommendations: [] };
	}
};

export const actions: Actions = {
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
