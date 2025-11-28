import { pgTable, text, timestamp, real, vector, bigint, uuid, jsonb, decimal, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const VECTOR_DIMENSIONS = 100;

export const users = pgTable('users', {
    id: bigint('id', { mode: 'number' }).primaryKey().default(sql`unique_rowid()`),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    password: text('password').notNull()
});

export const user_vectors = pgTable('user_vectors', {
    userId: bigint('user_id', { mode: 'number' })
        .primaryKey()
        .references(() => users.id, { onDelete: 'cascade' }),
    vector: vector('vector', { dimensions: VECTOR_DIMENSIONS }).notNull(),
    bias: real('bias').default(0.0).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const svd_metadata = pgTable('svd_metadata', {
    id: bigint('id', { mode: 'number' }).primaryKey().default(sql`unique_rowid()`),
    completionTime: timestamp('completion_time', { withTimezone: true }).notNull(),
    globalMean: real('global_mean').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const recipes = pgTable('recipes', {
    id: uuid('id').primaryKey().defaultRandom(),
    originalId: bigint('original_id', { mode: 'number' }),
    title: text('title'),
    description: text('description'),
    cookTime: bigint('cook_time', { mode: 'number' }),
    prepTime: bigint('prep_time', { mode: 'number' }),
    totalTime: bigint('total_time', { mode: 'number' }),
    ingredientsDetails: jsonb('ingredients_details'),
    ingredientsList: jsonb('ingredients_list'),
    rating: decimal('rating', { precision: 3, scale: 2 }),
    reviewCount: bigint('review_count', { mode: 'number' }),
    calories: decimal('calories', { precision: 10, scale: 2 }),
    imageUrl: text('image_url'),
    servings: bigint('servings', { mode: 'number' }),
    instructions: jsonb('instructions'),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
    return {
        ratingIdx: index('idx_recipes_rating').on(table.rating.desc(), table.reviewCount.desc()),
        ingredientsIdx: index('idx_recipes_ingredients_list').using('gin', table.ingredientsList)
    };
});

export const recipe_vectors = pgTable('recipe_vectors', {
    recipeId: uuid('recipe_id')
        .primaryKey()
        .references(() => recipes.id, { onDelete: 'cascade' }),
    vector: vector('vector', { dimensions: VECTOR_DIMENSIONS }).notNull(),
    bias: real('bias').default(0.0).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const schema = { users, user_vectors, svd_metadata, recipes, recipe_vectors };