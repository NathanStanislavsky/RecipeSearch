import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.ts';
import { users } from '$lib/server/db/schema.ts';

export async function getUserByEmail(email) {
	const result = await db.select().from(users).where(eq(users.email, email));
	return result.length > 0 ? result[0] : null;
  }
