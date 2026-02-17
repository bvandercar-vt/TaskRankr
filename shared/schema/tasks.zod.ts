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

import { type DrizzleZodDefaultRefine, pgNativeEnum } from './drizzle-utils'

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
  status: pgNativeEnum('status', TaskStatus).default(TaskStatus.OPEN).notNull(),
  description: text('description'),
  priority: pgNativeEnum('priority', Priority),
  ease: pgNativeEnum('ease', Ease),
  enjoyment: pgNativeEnum('enjoyment', Enjoyment),
  time: pgNativeEnum('time', Time),
  inProgressTime: integer('in_progress_time').default(0).notNull(), // Cumulative time in milliseconds
  inProgressStartedAt: timestamp('in_progress_started_at'), // When current in-progress session started
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  parentId: integer('parent_id'),
  subtaskSortMode: pgNativeEnum('subtask_sort_mode', SubtaskSortMode)
    .default(SubtaskSortMode.INHERIT)
    .notNull(),
  subtaskOrder: integer('subtask_order')
    .array()
    .default(sql`'{}'::integer[]`)
    .notNull(),
  subtasksShowNumbers: boolean('subtasks_show_numbers')
    .default(false)
    .notNull(),
  hidden: boolean('hidden').default(false).notNull(),
  autoHideCompleted: boolean('auto_hide_completed').default(false).notNull(),
  inheritCompletionState: boolean('inherit_completion_state')
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

const taskSchemaRefine = {
  // created schema from drizzle-zod does not apply zod default values.
  // https://github.com/drizzle-team/drizzle-orm/issues/5384
  status: (s) => s.default(TaskStatus.OPEN),
  subtaskSortMode: (s) => s.default(SubtaskSortMode.INHERIT),
  subtaskOrder: (s) => s.default([]),
  subtasksShowNumbers: (s) => s.default(false),
  hidden: (s) => s.default(false),
  autoHideCompleted: (s) => s.default(false),
  inheritCompletionState: (s) => s.default(false),
  inProgressTime: (s) => s.default(0),
  // not sure the created schema from drizzle-zod performs the coercion,
  // so add here just in case / for safety.
  createdAt: z.coerce.date().default(() => new Date()),
  completedAt: z.coerce.date().nullable(),
  inProgressStartedAt: z.coerce.date().nullable(),
} satisfies DrizzleZodDefaultRefine<typeof tasks>

export const taskSchema = createSelectSchema(tasks, taskSchemaRefine)

export type Task = z.infer<typeof taskSchema>

export const insertTaskSchema = createInsertSchema(tasks, taskSchemaRefine)
  .partial()
  .omit({ id: true })
  .required({
    name: true,
    userId: true,
  })

export type InsertTask = z.infer<typeof insertTaskSchema>
export type CreateTask = InsertTask

export const updateTaskSchema = createUpdateSchema(tasks, taskSchemaRefine)
  .partial()
  .required({ id: true })
  .omit({ userId: true })

export type UpdateTask = z.infer<typeof updateTaskSchema>

export type MutateTask = CreateTask | UpdateTask
