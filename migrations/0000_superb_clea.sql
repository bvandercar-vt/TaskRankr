CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"auto_pin_new_tasks" boolean DEFAULT true NOT NULL,
	"enable_in_progress_status" boolean DEFAULT true NOT NULL,
	"enable_in_progress_time" boolean DEFAULT true NOT NULL,
	"always_sort_pinned_by_priority" boolean DEFAULT true NOT NULL,
	"sort_by" text DEFAULT 'priority' NOT NULL,
	"field_config" jsonb DEFAULT '{"priority":{"visible":true,"required":true},"ease":{"visible":true,"required":true},"enjoyment":{"visible":true,"required":true},"time":{"visible":true,"required":true}}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"description" text,
	"priority" text,
	"ease" text,
	"enjoyment" text,
	"time" text,
	"in_progress_time" integer DEFAULT 0 NOT NULL,
	"in_progress_started_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"parent_id" integer,
	"subtask_sort_mode" text DEFAULT 'inherit' NOT NULL,
	"subtask_order" integer[] DEFAULT '{}'::integer[] NOT NULL
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");