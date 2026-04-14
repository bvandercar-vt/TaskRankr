/**
 * @fileoverview User settings hook. Manages user preferences with optimistic
 * updates.
 */

import { useMemo } from 'react'
import { toMerged } from 'es-toolkit'

import { DEFAULT_SETTINGS } from '@/lib/constants'
import { useLocalStateSafe } from '@/providers/LocalStateProvider'
import type { FieldConfig, FieldFlags, UserSettings } from '~/shared/schema'

export type UserSettingsContent = Omit<UserSettings, 'userId'>

export const useSettings = () => {
  const localState = useLocalStateSafe()

  const rawSettings = localState?.settings
  const settings: UserSettings = useMemo(
    () => toMerged(DEFAULT_SETTINGS, rawSettings ?? {}),
    [rawSettings],
  )
  const isLoading = !localState?.isInitialized

  const updateSettings = (value: Partial<UserSettings>) => {
    if (!localState) return
    localState.updateSettings(value)
  }

  const updateFieldFlags = (
    field: keyof FieldConfig,
    flags: Partial<FieldFlags>,
  ) => {
    if (!localState) return

    localState.updateSettings({
      fieldConfig: toMerged(settings.fieldConfig, {
        [field]: {
          visible: flags.visible,
          required: flags.visible ? flags.required : false,
        },
      }),
    })
  }

  return {
    settings,
    isLoading,
    updateSettings,
    updateFieldFlags,
  }
}
