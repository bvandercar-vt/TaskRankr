/**
 * @fileoverview User settings hook. Manages user preferences with optimistic
 * updates.
 */

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
    const current = settings.fieldConfig[field]
    localState.updateSettings({
      fieldConfig: {
        ...settings.fieldConfig,
        [field]: { ...current, ...flags },
      },
    })
  }

  return {
    settings,
    isLoading,
    updateSetting,
    updateFieldFlags,
  }
}
