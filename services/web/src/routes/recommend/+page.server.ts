import type { PageServerLoad } from "./$types.js";
import type { Actions } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { Storage } from "@google-cloud/storage";
import { GCS_BUCKET_NAME, RECOMMEND_URL, MONGODB_DATABASE, MONGODB_COLLECTION, MONGODB_REVIEWS_COLLECTION } from "$env/static/private";
import { getMongoClient } from '$lib/server/mongo/index.js';
import { ApiError, handleError } from '$utils/errors/AppError.js';
import { GoogleAuth } from 'google-auth-library';

interface TransformedRecipe {
    id: number;
    name: string;
    minutes: number;
    nutrition: string;
    steps: string;
    description: string;
    ingredients: string;
    userRating?: number;
}

async function getUserEmbedding(userId: string): Promise<number[] | null> {
    try {
        const bucket = new Storage().bucket(GCS_BUCKET_NAME);
        const userFileBlob = bucket.file(`user_embeddings/${userId}.json`)
        const [userFile] = await userFileBlob.download();
        return JSON.parse(userFile.toString('utf8'));
    } catch (error) {
        console.error(`Error fetching user embedding for ${userId}:`, error);
        return null;
    }
}

async function getRecipesByIds(recipe_ids: number[], user_id?: number): Promise<TransformedRecipe[]> {
    const client = getMongoClient();

    if (!client) {
        throw new ApiError('MongoDB client not found', 500);
    }

    try {
        const database = client.db(MONGODB_DATABASE);
        const recipesCollection = database.collection(MONGODB_COLLECTION);

        recipe_ids = recipe_ids.map(id => Number(id));

        const recipes = await recipesCollection.find({
            id: { $in: recipe_ids }
        }).toArray();

        // Fetch user ratings if user is authenticated
        let userRatings: Map<number, number> = new Map();
        if (user_id) {
            const reviewsCollection = database.collection(MONGODB_REVIEWS_COLLECTION);
            const ratingPipeline = [
                { $match: { user_id: String(user_id), recipe_id: { $exists: true } } },
                { $project: { recipe_id: 1, rating: 1 } }
            ];

            const ratings = await reviewsCollection.aggregate(ratingPipeline).toArray();
            userRatings = new Map(ratings.map((r) => [Number(r.recipe_id), r.rating]));
        }

        const results: TransformedRecipe[] = recipes.map((recipe) => ({
            id: recipe.id as number,
            name: recipe.name as string,
            minutes: recipe.minutes as number,
            nutrition: recipe.nutrition as string,
            steps: recipe.steps as string,
            description: recipe.description as string,
            ingredients: recipe.ingredients as string,
            userRating: userRatings.get(recipe.id as number)
        }));
        return results;
    } catch (error) {
        console.error('Error fetching recipes by IDs:', error);
        throw error;
    }
}

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        return {
            recommendations: []
        };
    }

    try {
        const user_embedding = await getUserEmbedding(locals.user.id.toString());

        if (!user_embedding) {
            return {
                recommendations: []
            };
        }

        const auth = new GoogleAuth();
        const client = await auth.getIdTokenClient(RECOMMEND_URL);

        const response = await client.request<{ recipe_ids: number[] }>({
            url: `${RECOMMEND_URL}/recommend`,
            method: "POST",
            data: { user_embedding },
            headers: { "Content-Type": "application/json" }
          });
        const data = response.data;

        const recommendations = await getRecipesByIds(data.recipe_ids, locals.user.id);

        return {
            recommendations
        };
    } catch (error) {
        console.error('Error getting recommendations:', error);
        return {
            recommendations: []
        };
    }
};

export const actions: Actions = {
	addRating: async ({ request, locals }) => {
		try {
			const formData = await request.formData();
			const recipe_id = formData.get('recipe_id')?.toString();
			const rating = formData.get('rating');

			if (!recipe_id || !rating) {
				throw new ApiError('Recipe ID and rating are required', 400);
			}

			const user_id = locals.user?.id?.toString();

			if (!user_id) {
				throw new ApiError('User not authenticated', 401);
			}

			const client = getMongoClient();
			if (!client) {
				throw new ApiError('Failed to connect to MongoDB', 500);
			}

			const db = client.db(MONGODB_DATABASE);
			const collection = db.collection(MONGODB_REVIEWS_COLLECTION);

			const result = await collection.updateOne(
				{ recipe_id, user_id },
				{ $set: { rating: Number(rating) } },
				{ upsert: true }
			);

			return {
				message: result.upsertedCount > 0 ? 'Rating created' : 'Rating updated',
				recipe_id,
				rating,
				upserted: result.upsertedCount > 0
			};
		} catch (error) {
			const errorResponse = handleError(error, 'Add Rating');
			return fail(errorResponse.status, { message: errorResponse.message });
		}
	}
};