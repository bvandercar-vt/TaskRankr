/**
 * @fileoverview User settings hook. Manages user preferences with optimistic
 * updates.
 */

import { toMerged } from 'es-toolkit'

import { useLocalStateSafe } from '@/components/providers/LocalStateProvider'
import { DEFAULT_SETTINGS } from '@/lib/constants'
import type { FieldFlags, RankField, UserSettings } from '~/shared/schema'

export type UserSettingsContent = Omit<UserSettings, 'userId'>

export const useSettings = () => {
  const localState = useLocalStateSafe()

  const settings: UserSettings = localState?.settings ?? DEFAULT_SETTINGS
  const isLoading = !localState?.isInitialized

  const updateSettings = (value: Partial<UserSettings>) => {
    if (!localState) return
    localState.updateSettings(value)
  }

  const updateFieldFlags = (field: RankField, flags: Partial<FieldFlags>) => {
    if (!localState) return
    localState.updateSettings({
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
