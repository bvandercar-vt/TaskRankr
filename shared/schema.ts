import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  priority: text("priority"),
  ease: text("ease"),
  enjoyment: text("enjoyment"),
  time: text("time"),
  parentId: integer("parent_id"),
  status: text("status").default("open").notNull(), // open, in_progress, pending, completed
  inProgressTime: integer("in_progress_time").default(0).notNull(), // Cumulative time in milliseconds
  inProgressStartedAt: timestamp("in_progress_started_at"), // When current in-progress session started
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  parent: one(tasks, {
    fields: [tasks.parentId],
    references: [tasks.id],
    relationName: "subtasks",
  }),
  subtasks: many(tasks, {
    relationName: "subtasks",
  }),
}));

// Status constants and types
export const TASK_STATUSES = ["open", "in_progress", "pending", "completed"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const taskStatusEnum = z.enum(TASK_STATUSES);

// Attribute level constants and types
export const PRIORITY_LEVELS = [
  "lowest",
  "low",
  "medium",
  "high",
  "highest",
] as const;
export const EASE_LEVELS = ["easy", "medium", "hard"] as const;
export const ENJOYMENT_LEVELS = ["low", "medium", "high"] as const;
export const TIME_LEVELS = ["low", "medium", "high"] as const;

export type Priority = (typeof PRIORITY_LEVELS)[number];
export type Ease = (typeof EASE_LEVELS)[number];
export type Enjoyment = (typeof ENJOYMENT_LEVELS)[number];
export type Time = (typeof TIME_LEVELS)[number];

export type TaskSortField = "priority" | "ease" | "enjoyment" | "time";

// Zod enums for validation
export const priorityEnum = z.enum(PRIORITY_LEVELS);
export const easeEnum = z.enum(EASE_LEVELS);
export const enjoymentEnum = z.enum(ENJOYMENT_LEVELS);
export const timeEnum = z.enum(TIME_LEVELS);

export const insertTaskSchema = createInsertSchema(tasks, {
  name: z.string().min(1, "Name is required"),
  status: taskStatusEnum.optional(),
  priority: priorityEnum.nullable().optional(),
  ease: easeEnum.nullable().optional(),
  enjoyment: enjoymentEnum.nullable().optional(),
  time: timeEnum.nullable().optional(),
  createdAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional().nullable(),
  inProgressStartedAt: z.coerce.date().optional().nullable(),
}).omit({
  id: true,
});

// Base type from Drizzle, then override attribute fields with enum types
type TaskBase = typeof tasks.$inferSelect;
export type Task = Omit<TaskBase, "status" | "priority" | "ease" | "enjoyment" | "time"> & {
  status: TaskStatus;
  priority: Priority | null;
  ease: Ease | null;
  enjoyment: Enjoyment | null;
  time: Time | null;
};

export type InsertTask = z.infer<typeof insertTaskSchema>;

// Request/Response types
export type CreateTaskRequest = InsertTask;
export type UpdateTaskRequest = Partial<InsertTask>;
export type TaskResponse = Task & { subtasks?: TaskResponse[] };
