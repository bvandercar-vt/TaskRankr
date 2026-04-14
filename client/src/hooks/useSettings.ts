/**
 * @fileoverview User settings hook. Manages user preferences with optimistic
 * updates.
 */

import { useMemo } from 'react'
import { toMerged } from 'es-toolkit'

import { DEFAULT_SETTINGS } from '@/lib/constants'
import { useLocalStateSafe } from '@/providers/LocalStateProvider'
import {
  sanitizeFieldConfig,
  type FieldConfig,
  type FieldFlags,
  type UserSettings,
} from '~/shared/schema'

export type UserSettingsContent = Omit<UserSettings, 'userId'>

export const useSettings = () => {
  const localState = useLocalStateSafe()

  const rawSettings = localState?.settings
  const settings: UserSettings = useMemo(() => {
    const merged = toMerged(DEFAULT_SETTINGS, rawSettings ?? {})
    return { ...merged, fieldConfig: sanitizeFieldConfig(merged.fieldConfig) }
  }, [rawSettings])
  const isLoading = !localState?.isInitialized

  const updateSettings = (value: Partial<UserSettings>) => {
    if (!localState) return
    const sanitized =
      value.fieldConfig != null
        ? { ...value, fieldConfig: sanitizeFieldConfig(value.fieldConfig) }
        : value
    localState.updateSettings(sanitized)
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
