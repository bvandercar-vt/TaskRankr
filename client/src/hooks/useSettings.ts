/**
 * @fileoverview User settings hook. Manages user preferences with optimistic
 * updates.
 */

import { useMemo } from 'react'
import { toMerged } from 'es-toolkit'

import { DEFAULT_SETTINGS } from '@/lib/constants'
import {
  useSettingsContext,
  useTasksContext,
} from '@/providers/LocalStateProvider'
import {
  type FieldConfig,
  type FieldFlags,
  sanitizeSettings,
  type UserSettings,
} from '~/shared/schema'

export type UserSettingsContent = Omit<UserSettings, 'userId'>

export const useSettings = () => {
  const settingsCtx = useSettingsContext()
  const tasksCtx = useTasksContext()

  const rawSettings = settingsCtx?.settings
  const settings: UserSettings = useMemo(
    () => sanitizeSettings(toMerged(DEFAULT_SETTINGS, rawSettings ?? {})),
    [rawSettings],
  )
  const isLoading = !tasksCtx?.isInitialized

  const updateSettings = (value: Partial<UserSettings>) => {
    if (!settingsCtx) return
    settingsCtx.updateSettings(sanitizeSettings(value))
  }

  const updateFieldFlags = (
    field: keyof FieldConfig,
    flags: Partial<FieldFlags>,
  ) => {
    updateSettings({
      fieldConfig: toMerged(settings.fieldConfig, { [field]: flags }),
    })
  }

  return {
    settings,
    isLoading,
    updateSettings,
    updateFieldFlags,
  }
}
