import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { schema } from '../database/schema.ts';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// For debugging
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	console.error('DATABASE_URL is not defined in environment variables');
	process.exit(1);
}

const pool = new Pool({
	connectionString: connectionString,
	ssl: {
		rejectUnauthorized: false
	}
});

export const db = drizzle(pool, { schema });
export { pool }; 