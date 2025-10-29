CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
ALTER TABLE "recipe_vectors" ALTER COLUMN "vector" SET DATA TYPE vector(100);--> statement-breakpoint
ALTER TABLE "user_vectors" ALTER COLUMN "vector" SET DATA TYPE vector(100);--> statement-breakpoint
ALTER TABLE "recipe_vectors" ADD COLUMN "bias" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "svd_metadata" ADD COLUMN "global_mean" real NOT NULL;--> statement-breakpoint
ALTER TABLE "user_vectors" ADD COLUMN "bias" real DEFAULT 0 NOT NULL;