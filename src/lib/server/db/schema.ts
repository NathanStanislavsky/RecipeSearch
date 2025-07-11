import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	password: text('password').notNull()
});

// stores only the recipes that users have favorited
export const recipes = pgTable('recipes', {
	id: serial('id').primaryKey(),
	image: text('image').notNull(),
	title: text('title').notNull(),
	readyInMinutes: integer('ready_in_minutes').notNull(),
	servings: integer('servings').notNull(),
	sourceUrl: text('source_url').notNull()
});

// relational table that links users to their favorite recipes by IDs
/*
	Cascading ensures that when a user is deleted any favorites records referencing that user will be deleted
	Same goes for recipes. When a recipe is deleted from recipes table then any reference to it from the favorites
	table will also be deleted.
*/
export const favorites = pgTable('favorites', {
	id: serial('id').primaryKey(),
	userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
	recipeId: integer('recipe_id').references(() => recipes.id, { onDelete: 'cascade' })
});

export const apiRequests = pgTable('api_requests', {
	id: serial('id').primaryKey(),
	date: text('date').notNull().unique(),
	count: integer('count').notNull().default(0)
});

export const ingredientSearches = pgTable('ingredient_searches', {
	id: serial('id').primaryKey(),
	ingredients: text('ingredients').notNull().unique(),
	recipeIds: text('recipe_ids').notNull(),
	createdAt: timestamp('created_at').defaultNow()
});

export const schema = { users, recipes, favorites, apiRequests };
