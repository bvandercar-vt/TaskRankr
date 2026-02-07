/**
 * @fileoverview Drizzle ORM schema definitions, Zod validation schemas, and
 * TypeScript types that are inferred from said schemas, including constants
 * (ie, string enums) that are relevant to these schemas (such as task status,
 * priority, etc.).
 */

import { relations } from 'drizzle-orm'
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

// Re-export auth models
export * from './models/auth'

// Status constants and types
export const TASK_STATUSES = [
  'open',
  'in_progress',
  'pinned',
  'completed',
] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]
export const taskStatusEnum = z.enum(TASK_STATUSES)

// Attribute level constants and types
export const PRIORITY_LEVELS = [
  'none',
  'lowest',
  'low',
  'medium',
  'high',
  'highest',
] as const
export const EASE_LEVELS = [
  'none',
  'easiest',
  'easy',
  'medium',
  'hard',
  'hardest',
] as const
export const ENJOYMENT_LEVELS = [
  'none',
  'lowest',
  'low',
  'medium',
  'high',
  'highest',
] as const
export const TIME_LEVELS = [
  'none',
  'lowest',
  'low',
  'medium',
  'high',
  'highest',
] as const

export type Priority = (typeof PRIORITY_LEVELS)[number]
export type Ease = (typeof EASE_LEVELS)[number]
export type Enjoyment = (typeof ENJOYMENT_LEVELS)[number]
export type Time = (typeof TIME_LEVELS)[number]

export const SORT_OPTIONS = [
  'date',
  'priority',
  'ease',
  'enjoyment',
  'time',
] as const
export type SortOption = (typeof SORT_OPTIONS)[number]

export type RankField = Exclude<SortOption, 'date'>

/** Are in display order. */
export const RANK_FIELDS_CRITERIA = [
  {
    name: 'priority',
    label: 'Priority',
    levels: PRIORITY_LEVELS,
  },
  {
    name: 'ease',
    label: 'Ease',
    levels: EASE_LEVELS,
  },
  {
    name: 'enjoyment',
    label: 'Enjoyment',
    labelShort: 'Enjoy',
    levels: ENJOYMENT_LEVELS,
  },
  {
    name: 'time',
    label: 'Time',
    levels: TIME_LEVELS,
  },
] as const satisfies {
  name: RankField
  label: string
  labelShort?: string
  levels: readonly string[]
}[]

export type RankFieldValueMap = {
  priority: Priority
  ease: Ease
  enjoyment: Enjoyment
  time: Time
}

// Zod enums for validation
export const priorityEnum = z.enum(PRIORITY_LEVELS)
export const easeEnum = z.enum(EASE_LEVELS)
export const enjoymentEnum = z.enum(ENJOYMENT_LEVELS)
export const timeEnum = z.enum(TIME_LEVELS)

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(), // Owner of the task
  name: text('name').notNull(),
  status: text('status').default('open').notNull(), // open, in_progress, pinned, completed
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
  status: taskStatusEnum,
  priority: priorityEnum.nullable(),
  ease: easeEnum.nullable(),
  enjoyment: enjoymentEnum.nullable(),
  time: timeEnum.nullable(),
  createdAt: z.coerce.date(),
  completedAt: z.coerce.date().nullish(),
  inProgressStartedAt: z.coerce.date().nullish(),
} as const

export const taskSchema = createSelectSchema(tasks).extend(taskSchemaCommon)

export type Task = z.infer<typeof taskSchema>

export type TaskResponse = Task & { subtasks: TaskResponse[] }

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

// User Settings
export const userSettings = pgTable('user_settings', {
  userId: varchar('user_id').primaryKey(),
  autoPinNewTasks: boolean('auto_pin_new_tasks').default(true).notNull(),
  enableInProgressStatus: boolean('enable_in_progress_status')
    .default(true)
    .notNull(),
  enableInProgressTime: boolean('enable_in_progress_time')
    .default(true)
    .notNull(),
  alwaysSortPinnedByPriority: boolean('always_sort_pinned_by_priority')
    .default(true)
    .notNull(),
  sortBy: text('sort_by').default('priority').notNull(),
  // Attribute visibility settings
  priorityVisible: boolean('priority_visible').default(true).notNull(),
  priorityRequired: boolean('priority_required').default(true).notNull(),
  easeVisible: boolean('ease_visible').default(true).notNull(),
  easeRequired: boolean('ease_required').default(true).notNull(),
  enjoymentVisible: boolean('enjoyment_visible').default(true).notNull(),
  enjoymentRequired: boolean('enjoyment_required').default(true).notNull(),
  timeVisible: boolean('time_visible').default(true).notNull(),
  timeRequired: boolean('time_required').default(true).notNull(),
})

const userSettingsCommon = {
  userId: z.string().min(1),
  sortBy: z.enum(SORT_OPTIONS).optional().default('date'),
}

export const userSettingsSchema = createSelectSchema(
  userSettings,
  userSettingsCommon,
)

export const insertUserSettingsSchema = createInsertSchema(
  userSettings,
  userSettingsCommon,
)

export type UserSettings = z.infer<typeof userSettingsSchema>
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>
