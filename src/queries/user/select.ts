import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.ts';
import { users } from '$lib/server/db/schema.ts';
import type { User } from '../../types/user.ts';

export async function getUserByEmail(email: string): Promise<User | null> {
	const result = await db.select().from(users).where(eq(users.email, email));
	return result.length > 0 ? result[0] : null;
}
