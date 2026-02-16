ALTER TABLE "user_settings" ALTER COLUMN "sort_by" SET DEFAULT 'date_created';--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "subtasks_show_numbers" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "auto_hide_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "inherit_completion_state" boolean DEFAULT false NOT NULL;