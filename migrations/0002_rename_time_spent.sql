ALTER TABLE "user_settings" DROP COLUMN "enable_in_progress_time";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "in_progress_time" TO "time_spent";
