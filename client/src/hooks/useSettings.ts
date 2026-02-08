/**
 * @fileoverview User settings hook. Manages user preferences with optimistic
 * updates.
 */

import { toMerged } from 'es-toolkit'

import { useLocalStateSafe } from '@/components/providers/LocalStateProvider'
import { DEFAULT_SETTINGS } from '@/lib/constants'
import type { FieldFlags, RankField, UserSettings } from '~/shared/schema'

export type { UserSettings }
export { DEFAULT_SETTINGS }

export const useSettings = () => {
  const localState = useLocalStateSafe()

  const settings: UserSettings = localState?.settings ?? DEFAULT_SETTINGS
  const isLoading = !localState?.isInitialized

  const updateSetting = <K extends keyof Omit<UserSettings, 'userId'>>(
    key: K,
    value: UserSettings[K],
  ) => {
    if (!localState) return
    localState.updateSettings({ [key]: value })
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
    updateSetting,
    updateFieldFlags,
  }
}
