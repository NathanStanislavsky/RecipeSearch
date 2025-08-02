import type { PageServerLoad } from "./$types.js";
import { Storage } from "@google-cloud/storage";
import { GCS_BUCKET_NAME, RECOMMEND_URL, MONGODB_DATABASE, MONGODB_COLLECTION } from "$env/static/private";
import { getMongoClient } from '$lib/server/mongo/index.js';
import { ApiError } from '$utils/errors/AppError.js';

interface TransformedRecipe {
    id: number;
    name: string;
    minutes: number;
    nutrition: string;
    steps: string;
    description: string;
    ingredients: string;
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

async function getRecipesByIds(recipe_ids: number[]): Promise<TransformedRecipe[]> {
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

        const results: TransformedRecipe[] = recipes.map((recipe) => ({
            id: recipe.id as number,
            name: recipe.name as string,
            minutes: recipe.minutes as number,
            nutrition: recipe.nutrition as string,
            steps: recipe.steps as string,
            description: recipe.description as string,
            ingredients: recipe.ingredients as string,
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

        const response = await fetch(`${RECOMMEND_URL}/recommend`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_embedding: user_embedding
            })
        });
        const data = await response.json();

        const recommendations = await getRecipesByIds(data.recipe_ids);

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