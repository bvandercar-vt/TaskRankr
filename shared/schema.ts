import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"), // For the "text box" details
  priority: text("priority"), // low, medium, high
  ease: text("ease"), // easy, medium, hard
  enjoyment: text("enjoyment"), // low, medium, high
  time: text("time"), // low, medium, high
  parentId: integer("parent_id"), // For nested tasks
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  parent: one(tasks, {
    fields: [tasks.parentId],
    references: [tasks.id],
    relationName: "subtasks"
  }),
  subtasks: many(tasks, {
    relationName: "subtasks"
  }),
}));

export const insertTaskSchema = createInsertSchema(tasks, {
  createdAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional().nullable(),
}).omit({ 
  id: true, 
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

// Enums for validation and UI
export const PRIORITY_LEVELS = ["low", "medium", "high"] as const;
export const EASE_LEVELS = ["easy", "medium", "hard"] as const;
export const ENJOYMENT_LEVELS = ["low", "medium", "high"] as const;
export const TIME_LEVELS = ["low", "medium", "high"] as const;

export type Priority = typeof PRIORITY_LEVELS[number];
export type Ease = typeof EASE_LEVELS[number];
export type Enjoyment = typeof ENJOYMENT_LEVELS[number];
export type Time = typeof TIME_LEVELS[number];

// Request/Response types
export type CreateTaskRequest = InsertTask;
export type UpdateTaskRequest = Partial<InsertTask>;
export type TaskResponse = Task & { subtasks?: TaskResponse[] }; // Recursive for frontend convenience if needed
