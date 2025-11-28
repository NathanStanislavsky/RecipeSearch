import { pgTable, text, timestamp, real, vector, bigint, uuid, jsonb, decimal, index, integer } from 'drizzle-orm/pg-core';
import { sql, desc } from 'drizzle-orm';

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
});

export const recipesRatingIdx = index('idx_recipes_rating')
    .on(desc(recipes.rating), desc(recipes.reviewCount));

export const recipesIngredientsIdx = index('idx_recipes_ingredients_list')
    .using('gin', recipes.ingredientsList);

export const recipe_vectors = pgTable('recipe_vectors', {
    recipeId: uuid('recipe_id')
        .primaryKey()
        .references(() => recipes.id, { onDelete: 'cascade' }),
    vector: vector('vector', { dimensions: VECTOR_DIMENSIONS }).notNull(),
    bias: real('bias').default(0.0).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const reviews = pgTable('reviews', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    recipeId: bigint('recipe_id', { mode: 'number' }).notNull(),
    authorId: bigint('author_id', { mode: 'number' }),
    authorName: text('author_name'),
    rating: integer('rating'),
    content: text('content'),
    dateSubmitted: timestamp('date_submitted', { withTimezone: true }),
    dateModified: timestamp('date_modified', { withTimezone: true }),
});

export const reviewsRecipeIdIdx = index('idx_reviews_recipe_id')
    .on(reviews.recipeId);

export const reviewsDateIdx = index('idx_reviews_date')
    .on(desc(reviews.dateSubmitted));

export const schema = { users, user_vectors, svd_metadata, recipes, recipe_vectors, reviews };