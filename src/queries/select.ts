import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.ts';
import { users } from '$lib/server/db/schema.ts';

export async function getUserByEmail(email) {
	return db.select().from(users).where(eq(users.email, email));
}
