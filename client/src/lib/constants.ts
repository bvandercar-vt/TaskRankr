/**
 * @fileoverview Application-wide constants and configuration values
 */

import type { UserSettings } from '~/shared/schema'

export const IconSizeStyle = {
  HW4: 'h-4 w-4',
  HW5: 'h-5 w-5',
  HW6: 'h-6 w-6',
  HW8: 'h-8 w-8',
} as const

export const DEFAULT_SETTINGS: UserSettings = {
  userId: '',
  autoPinNewTasks: true,
  enableInProgressStatus: true,
  enableInProgressTime: true,
  alwaysSortPinnedByPriority: true,
  sortBy: 'priority',
  priorityVisible: true,
  priorityRequired: true,
  easeVisible: true,
  easeRequired: true,
  enjoymentVisible: true,
  enjoymentRequired: true,
  timeVisible: true,
  timeRequired: true,
}
