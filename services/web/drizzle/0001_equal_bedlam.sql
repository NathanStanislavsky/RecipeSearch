CREATE TABLE "api_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "api_requests_date_unique" UNIQUE("date")
);