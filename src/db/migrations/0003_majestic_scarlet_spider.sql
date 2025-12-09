DROP TABLE "sync_configs" CASCADE;--> statement-breakpoint
DROP TABLE "sync_logs" CASCADE;--> statement-breakpoint
ALTER TABLE "user_tables" ADD COLUMN "mapping" json NOT NULL;