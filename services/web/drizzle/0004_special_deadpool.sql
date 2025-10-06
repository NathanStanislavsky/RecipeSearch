CREATE TABLE "recipe_vectors" (
	"recipe_id" integer PRIMARY KEY NOT NULL,
	"vector" real[] NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
