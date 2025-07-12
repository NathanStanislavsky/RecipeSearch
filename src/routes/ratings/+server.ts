import type { RequestHandler } from '@sveltejs/kit';
import { createJsonResponse } from '$utils/api/apiUtils.ts';
import { ApiError, handleError } from '$utils/errors/AppError.ts';
import { getMongoClient } from '$lib/server/mongo/index.ts';

interface RecipeRating {
    recipeId: string;
    rating: number;
}

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const body = await request.json();
        const { recipeId, rating } = body as RecipeRating;
        const userId = locals.user.id;

        const client = getMongoClient();
        if (!client) {
            throw new ApiError('Failed to connect to MongoDB', 500);
        }

        const db = client.db(process.env.MONGODB_DATABASE);
        const collection = db.collection(process.env.MONGODB_COLLECTION as string);

        const result = await collection.updateOne(
            { recipeId, userId },
            { $set: { rating } },
            { upsert: true }
        );

        return createJsonResponse({
            message: result.upsertedCount > 0 ? 'Rating created' : 'Rating updated',
            recipeId,
            rating,
            upserted: result.upsertedCount > 0
        }, 200);
    } catch (error) {
        const errorResponse = handleError(error, 'POST /ratings');
        return createJsonResponse(errorResponse, errorResponse.status);
    }
}
