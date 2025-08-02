import type { PageServerLoad } from "./$types.js";
import { Storage } from "@google-cloud/storage";
import { GCS_BUCKET_NAME, RECOMMEND_URL } from "$env/static/private";

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


        console.log(data);
        return {
            recommendations: data.recipe_ids
        };
    } catch (error) {
        console.error(error);
        return {
            recommendations: []
        };
    }
};