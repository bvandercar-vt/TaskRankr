UPDATE "user_settings"
SET "field_config" = jsonb_set("field_config", '{timeSpent,visible}', 'false')
WHERE "enable_in_progress_time" = false;--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "enable_in_progress_time";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "in_progress_time" TO "time_spent";
