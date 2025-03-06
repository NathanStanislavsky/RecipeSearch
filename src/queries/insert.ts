import { db } from '$lib/server/db/index.ts';
import { users } from '$lib/server/db/schema.ts';

export async function createUser(data) {
	await db.insert(users).values(data);
}
