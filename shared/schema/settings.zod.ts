/**
 * @fileoverview User settings Drizzle schema, Zod validation, and types.
 * Includes per-field visibility/required config (fieldConfig JSONB column).
 */

import { boolean, jsonb, pgTable, text, varchar } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export enum SortOption {
  DATE_CREATED = 'date_created',
  PRIORITY = 'priority',
  EASE = 'ease',
  ENJOYMENT = 'enjoyment',
  TIME = 'time',
}

export type RankField = Exclude<SortOption, `date_${string}`>

export const fieldFlagsSchema = z.object({
  visible: z.boolean(),
  required: z.boolean(),
})

export type FieldFlags = z.infer<typeof fieldFlagsSchema>

export const fieldConfigSchema = z.object({
  priority: fieldFlagsSchema,
  ease: fieldFlagsSchema,
  enjoyment: fieldFlagsSchema,
  time: fieldFlagsSchema,
} satisfies Record<RankField, typeof fieldFlagsSchema>)

export type FieldConfig = z.infer<typeof fieldConfigSchema>

export const DEFAULT_FIELD_CONFIG: FieldConfig = {
  priority: { visible: true, required: true },
  ease: { visible: true, required: true },
  enjoyment: { visible: true, required: true },
  time: { visible: true, required: true },
}

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
  sortBy: text('sort_by').default(SortOption.DATE_CREATED).notNull(),
  fieldConfig: jsonb('field_config')
    .$type<FieldConfig>()
    .default(DEFAULT_FIELD_CONFIG)
    .notNull(),
})

const userSettingsCommon = {
  userId: z.string().min(1),
  sortBy: z.nativeEnum(SortOption).optional().default(SortOption.DATE_CREATED),
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
