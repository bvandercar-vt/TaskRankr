/**
 * @fileoverview User settings hook. Manages user preferences with optimistic
 * updates.
 */

import { useLocalStateSafe } from '@/components/LocalStateProvider'
import { type AppSettings, DEFAULT_SETTINGS } from '@/lib/constants'
import { queryClient } from '@/lib/query-client'
import { QueryKeys } from '@/lib/ts-rest'
import type { PickByKey } from '@/types'
import type { RankField, UserSettings } from '~/shared/schema'

export type { AppSettings }
export { DEFAULT_SETTINGS }

export interface AttributeVisibility {
  visible: boolean
  required: boolean
}

export const useSettings = () => {
  const localState = useLocalStateSafe()

  const settings: AppSettings = localState?.settings ?? DEFAULT_SETTINGS
  const isLoading = !localState?.isInitialized

  const updateSetting = <K extends keyof Omit<AppSettings, 'userId'>>(
    key: K,
    value: AppSettings[K],
  ) => {
    if (!localState) return
    localState.updateSettings({ [key]: value })
  }

  const updateVisibility = (field: RankField, visible: boolean) =>
    updateSetting(getIsVisibleKey(field), visible)

  const updateRequired = (field: RankField, required: boolean) =>
    updateSetting(getIsRequiredKey(field), required)

  return {
    settings,
    isLoading,
    updateSetting,
    updateVisibility,
    updateRequired,
  }
}

const getIsVisibleKey = <T extends RankField>(field: T) =>
  `${field}Visible` as const satisfies keyof UserSettings

const getIsRequiredKey = <T extends RankField>(field: T) =>
  `${field}Required` as const satisfies keyof UserSettings

export const getIsVisible = (
  field: RankField,
  settings: PickByKey<UserSettings, `${string}Visible`>,
) => settings[getIsVisibleKey(field)]

export const getIsRequired = (
  field: RankField,
  settings: PickByKey<UserSettings, `${string}Required`>,
) => settings[getIsRequiredKey(field)]

export const getSettings = (): AppSettings => {
  const cached = queryClient.getQueryData<{
    status: number
    body: AppSettings
  }>(QueryKeys.getSettings)
  if (cached?.status === 200) {
    return cached.body
  }
  return DEFAULT_SETTINGS
}
