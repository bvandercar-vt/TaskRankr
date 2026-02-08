/**
 * @fileoverview Drizzle ORM schema definitions, Zod validation schemas, and
 * TypeScript types that are inferred from said schemas, including constants
 * (ie, string enums) that are relevant to these schemas (such as task status,
 * priority, etc.).
 */

import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
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

export enum SortOption {
  DATE = 'date',
  PRIORITY = 'priority',
  EASE = 'ease',
  ENJOYMENT = 'enjoyment',
  TIME = 'time',
}

export type RankField = Exclude<SortOption, SortOption.DATE>

/** Are in display order. */
export const RANK_FIELDS_CRITERIA = [
  {
    name: SortOption.PRIORITY,
    label: 'Priority',
    levels: Object.values(Priority),
  },
  {
    name: SortOption.EASE,
    label: 'Ease',
    levels: Object.values(Ease),
  },
  {
    name: SortOption.ENJOYMENT,
    label: 'Enjoyment',
    labelShort: 'Enjoy',
    levels: Object.values(Enjoyment),
  },
  {
    name: SortOption.TIME,
    label: 'Time',
    levels: Object.values(Time),
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

export type FieldFlags = { visible: boolean; required: boolean }
export type FieldConfig = Record<RankField, FieldFlags>

const fieldFlagsSchema = z.object({
  visible: z.boolean(),
  required: z.boolean(),
})

export const fieldConfigSchema: z.ZodType<FieldConfig> = z.object({
  priority: fieldFlagsSchema,
  ease: fieldFlagsSchema,
  enjoyment: fieldFlagsSchema,
  time: fieldFlagsSchema,
})

export const DEFAULT_FIELD_CONFIG: FieldConfig = {
  priority: { visible: true, required: true },
  ease: { visible: true, required: true },
  enjoyment: { visible: true, required: true },
  time: { visible: true, required: true },
}

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
  subtaskSortMode: text('subtask_sort_mode').default('inherit').notNull(), // inherit, manual
  subtaskOrder: integer('subtask_order')
    .array()
    .default(sql`'{}'::integer[]`)
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
  fieldConfig: jsonb('field_config')
    .$type<FieldConfig>()
    .default(DEFAULT_FIELD_CONFIG)
    .notNull(),
})

const userSettingsCommon = {
  userId: z.string().min(1),
  sortBy: z.nativeEnum(SortOption).optional().default(SortOption.DATE),
  fieldConfig: fieldConfigSchema.default(DEFAULT_FIELD_CONFIG),
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
