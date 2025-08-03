import { getMongoClient } from '../connections/mongodb.js';
import { MONGODB_DATABASE, MONGODB_REVIEWS_COLLECTION } from '$env/static/private';
import { ApiError } from '$utils/errors/AppError.js';

export class RatingRepository {
	private async getCollection() {
		const client = getMongoClient();
		if (!client) {
			throw new ApiError('MongoDB client not available', 500);
		}
		return client.db(MONGODB_DATABASE).collection(MONGODB_REVIEWS_COLLECTION);
	}

	/**
	 * Get all ratings for a specific user
	 */
	async getUserRatings(userId: number): Promise<Map<number, number>> {
		const collection = await this.getCollection();

		try {
			const ratingPipeline = [
				{ $match: { user_id: String(userId), recipe_id: { $exists: true } } },
				{ $project: { recipe_id: 1, rating: 1 } }
			];

			const ratings = await collection.aggregate(ratingPipeline).toArray();
			return new Map(ratings.map((r) => [Number(r.recipe_id), r.rating]));
		} catch (error) {
			console.error('Error fetching user ratings:', error);
			throw error;
		}
	}

	/**
	 * Get rating for a specific recipe by a specific user
	 */
	async getUserRatingForRecipe(userId: number, recipeId: number): Promise<number | null> {
		const collection = await this.getCollection();

		try {
			const rating = await collection.findOne({
				user_id: String(userId),
				recipe_id: String(recipeId)
			});

			return rating ? rating.rating : null;
		} catch (error) {
			console.error('Error fetching user rating for recipe:', error);
			throw error;
		}
	}

	/**
	 * Create or update a rating for a recipe
	 */
	async upsertRating(
		userId: number,
		recipeId: number,
		rating: number
	): Promise<{
		upserted: boolean;
		rating: number;
	}> {
		const collection = await this.getCollection();

		try {
			const result = await collection.updateOne(
				{ recipe_id: String(recipeId), user_id: String(userId) },
				{ $set: { rating: Number(rating) } },
				{ upsert: true }
			);

			return {
				upserted: result.upsertedCount > 0,
				rating: Number(rating)
			};
		} catch (error) {
			console.error('Error upserting rating:', error);
			throw error;
		}
	}

	/**
	 * Delete a rating
	 */
	async deleteRating(userId: number, recipeId: number): Promise<boolean> {
		const collection = await this.getCollection();

		try {
			const result = await collection.deleteOne({
				user_id: String(userId),
				recipe_id: String(recipeId)
			});

			return result.deletedCount > 0;
		} catch (error) {
			console.error('Error deleting rating:', error);
			throw error;
		}
	}

	/**
	 * Get average rating for a recipe
	 */
	async getAverageRating(recipeId: number): Promise<number | null> {
		const collection = await this.getCollection();

		try {
			const pipeline = [
				{ $match: { recipe_id: String(recipeId) } },
				{
					$group: {
						_id: null,
						averageRating: { $avg: '$rating' },
						count: { $sum: 1 }
					}
				}
			];

			const result = await collection.aggregate(pipeline).toArray();
			return result.length > 0 ? result[0].averageRating : null;
		} catch (error) {
			console.error('Error calculating average rating:', error);
			throw error;
		}
	}

	/**
	 * Get ratings statistics for a recipe
	 */
	async getRatingStats(recipeId: number): Promise<{
		average: number;
		count: number;
		distribution: { [rating: number]: number };
	} | null> {
		const collection = await this.getCollection();

		try {
			const pipeline = [
				{ $match: { recipe_id: String(recipeId) } },
				{
					$group: {
						_id: '$rating',
						count: { $sum: 1 }
					}
				}
			];

			const distribution = await collection.aggregate(pipeline).toArray();

			if (distribution.length === 0) return null;

			const ratingCounts: { [rating: number]: number } = {};
			let totalRatings = 0;
			let totalScore = 0;

			distribution.forEach((item) => {
				const rating = item._id;
				const count = item.count;
				ratingCounts[rating] = count;
				totalRatings += count;
				totalScore += rating * count;
			});

			return {
				average: totalScore / totalRatings,
				count: totalRatings,
				distribution: ratingCounts
			};
		} catch (error) {
			console.error('Error getting rating stats:', error);
			throw error;
		}
	}
}
