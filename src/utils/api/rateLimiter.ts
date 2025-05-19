import { db } from '$lib/server/db/index.js';
import { apiRequests } from '$lib/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { ConfigError } from '../errors/AppError.js';

const DAILY_LIMIT = 50;

export class RateLimiter {
	private static async getTodayRecord() {
		const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

		const result = await db.select().from(apiRequests).where(eq(apiRequests.date, today));

		return result[0];
	}

	private static async createTodayRecord() {
		const today = new Date().toISOString().split('T')[0];

		const result = await db
			.insert(apiRequests)
			.values({
				date: today,
				count: 1
			})
			.returning();

		return result[0];
	}

	private static async incrementCounter() {
		const today = new Date().toISOString().split('T')[0];

		const result = await db
			.update(apiRequests)
			.set({
				count: sql`count + 1`
			})
			.where(eq(apiRequests.date, today))
			.returning();

		return result[0];
	}

	public static async checkAndIncrement(): Promise<boolean> {
		try {
			let record = await this.getTodayRecord();

			if (!record) {
				record = await this.createTodayRecord();
			}

			if (record.count >= DAILY_LIMIT) {
				return false;
			}

			await this.incrementCounter();
			return true;
		} catch (error) {
			console.error('Rate limiter error:', error);
			throw new ConfigError('Failed to check rate limit');
		}
	}
}
