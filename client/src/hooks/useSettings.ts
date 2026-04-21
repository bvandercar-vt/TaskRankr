/**
 * @fileoverview User settings hook. Manages user preferences with optimistic
 * updates.
 */

import { useMemo } from 'react'
import { toMerged } from 'es-toolkit'

import { DEFAULT_SETTINGS } from '@/lib/constants'
import { useLocalState } from '@/providers/LocalStateProvider'
import {
  type FieldConfig,
  type FieldFlags,
  sanitizeSettings,
  type UserSettings,
} from '~/shared/schema'

export type UserSettingsContent = Omit<UserSettings, 'userId'>

export const useSettings = () => {
  const localState = useLocalState()

  const settings: UserSettings = useMemo(
    () =>
      sanitizeSettings(toMerged(DEFAULT_SETTINGS, localState.settings ?? {})),
    [localState.settings],
  )

  const updateSettings = (value: Partial<UserSettings>) =>
    localState.updateSettings(sanitizeSettings(value))

  const updateFieldFlags = (
    field: keyof FieldConfig,
    flags: Partial<FieldFlags>,
  ) =>
    updateSettings({
      fieldConfig: toMerged(settings.fieldConfig, { [field]: flags }),
    })

  return {
    settings,
    isLoading: !localState.isInitialized,
    updateSettings,
    updateFieldFlags,
  }
}
