CREATE TABLE "user_tables" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"table_name" text NOT NULL,
	"sheet_id" text NOT NULL,
	"sheet_tab" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_tables_table_name_unique" UNIQUE("table_name")
);
--> statement-breakpoint
ALTER TABLE "sync_configs" RENAME COLUMN "table_name" TO "user_table_id";--> statement-breakpoint
ALTER TABLE "sync_configs" ADD CONSTRAINT "sync_configs_user_table_id_user_tables_id_fk" FOREIGN KEY ("user_table_id") REFERENCES "public"."user_tables"("id") ON DELETE no action ON UPDATE no action;