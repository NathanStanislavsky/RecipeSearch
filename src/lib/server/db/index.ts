import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { schema } from './schema';
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

// Test the connection before exporting
pool.query('SELECT NOW()', (err, res) => {
	if (err) {
		console.error('Database connection error:', err.message);
	} else {
		console.log('Successfully connected to database:', res.rows[0].now);
	}
});

export const db = drizzle(pool, { schema });
