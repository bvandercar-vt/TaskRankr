/**
 * @fileoverview Task-related Drizzle schema, Zod validation, types, and enums.
 */

import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import { z } from 'zod'

// Status constants and types
export enum TaskStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PINNED = 'pinned',
  COMPLETED = 'completed',
}

// Subtask sort mode constants
export enum SubtaskSortMode {
  INHERIT = 'inherit',
  MANUAL = 'manual',
}

// Attribute level constants and types
export enum Priority {
  LOWEST = 'lowest',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  HIGHEST = 'highest',
}

export enum Ease {
  EASIEST = 'easiest',
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  HARDEST = 'hardest',
}

export enum Enjoyment {
  LOWEST = 'lowest',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  HIGHEST = 'highest',
}

export enum Time {
  LOWEST = 'lowest',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  HIGHEST = 'highest',
}

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(), // Owner of the task
  name: text('name').notNull(),
  status: text('status').default(TaskStatus.OPEN).notNull(),
  description: text('description'),
  priority: text('priority'),
  ease: text('ease'),
  enjoyment: text('enjoyment'),
  time: text('time'),
  inProgressTime: integer('in_progress_time').default(0).notNull(), // Cumulative time in milliseconds
  inProgressStartedAt: timestamp('in_progress_started_at'), // When current in-progress session started
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  parentId: integer('parent_id'),
  subtaskSortMode: text('subtask_sort_mode')
    .default(SubtaskSortMode.INHERIT)
    .notNull(),
  subtaskOrder: integer('subtask_order')
    .array()
    .default(sql`'{}'::integer[]`)
    .notNull(),
  subtasksShowNumbers: boolean('subtasks_show_numbers')
    .default(false)
    .notNull(),
})

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  parent: one(tasks, {
    fields: [tasks.parentId],
    references: [tasks.id],
    relationName: 'subtasks',
  }),
  subtasks: many(tasks, {
    relationName: 'subtasks',
  }),
}))

const taskSchemaCommon = {
  userId: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'Name is required'),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(Priority).nullable(),
  ease: z.nativeEnum(Ease).nullable(),
  enjoyment: z.nativeEnum(Enjoyment).nullable(),
  time: z.nativeEnum(Time).nullable(),
  subtaskSortMode: z
    .nativeEnum(SubtaskSortMode)
    .default(SubtaskSortMode.INHERIT),
  subtaskOrder: z.array(z.number()).default([]),
  subtasksShowNumbers: z.boolean().default(false),
  createdAt: z.coerce.date(),
  completedAt: z.coerce.date().nullish(),
  inProgressStartedAt: z.coerce.date().nullish(),
} as const

export const taskSchema = createSelectSchema(tasks).extend(taskSchemaCommon)

export type Task = z.infer<typeof taskSchema>

export type TaskWithSubtasks = Task & { subtasks: TaskWithSubtasks[] }

export const insertTaskSchema = createInsertSchema(tasks, taskSchemaCommon)
  .partial()
  .omit({ id: true })
  .required({
    name: true,
    userId: true,
  })

export type InsertTask = z.infer<typeof insertTaskSchema>
export type CreateTask = InsertTask

export const updateTaskSchema = createUpdateSchema(tasks, taskSchemaCommon)
  .partial()
  .required({ id: true })
  .omit({ userId: true })

export type UpdateTask = z.infer<typeof updateTaskSchema>

export type MutateTask = CreateTask | UpdateTask
