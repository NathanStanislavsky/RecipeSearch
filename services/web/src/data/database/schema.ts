import { pgTable, serial, text, timestamp, integer, real, vector } from 'drizzle-orm/pg-core';

const VECTOR_DIMENSIONS = 100;

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	password: text('password').notNull()
});

export const user_vectors = pgTable('user_vectors', {
	user_id: integer('user_id').primaryKey().references(() => users.id),
	vector: vector('vector', { dimensions: VECTOR_DIMENSIONS }).notNull(),
	bias: real('bias').default(0.0).notNull(),
	updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const svd_metadata = pgTable('svd_metadata', {
	id: serial('id').primaryKey(),
	completion_time: timestamp('completion_time', { withTimezone: true }).notNull(),
	global_mean: real('global_mean').notNull(),
	created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const recipe_vectors = pgTable('recipe_vectors', {
	recipe_id: integer('recipe_id').primaryKey(),
	vector: vector('vector', { dimensions: VECTOR_DIMENSIONS }).notNull(),
	bias: real('bias').default(0.0).notNull(),
	updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const schema = { users, user_vectors, svd_metadata, recipe_vectors };