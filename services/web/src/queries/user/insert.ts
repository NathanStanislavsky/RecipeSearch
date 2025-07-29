import { db } from '$lib/server/db/index.ts';
import { users } from '$lib/server/db/schema.ts';

export async function createUser(data: { email: string; password: string; name: string }) {
	const result = await db.insert(users).values(data).returning();
	return result[0];
}
