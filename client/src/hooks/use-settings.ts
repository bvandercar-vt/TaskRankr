import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useDemoSafe } from '@/components/DemoProvider'
import { useToast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/query-client'
import { QueryKeys, tsr } from '@/lib/ts-rest'
import type { PickByKey } from '@/types'
import type { RankField, SortOption, UserSettings } from '~/shared/schema'

export interface AttributeVisibility {
  visible: boolean
  required: boolean
}

export interface AppSettings extends Omit<UserSettings, 'sortBy'> {
  sortBy: SortOption
}

const DEFAULT_SETTINGS: Omit<AppSettings, 'userId'> = {
  autoPinNewTasks: true,
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

const DEMO_ERROR_MESSAGE = 'Create an account to save your settings'

export const useSettings = () => {
  const qc = useQueryClient()
  const { toast } = useToast()
  const { isDemo, demoSettings } = useDemoSafe()

  const { data, isLoading } = tsr.settings.get.useQuery({
    queryKey: QueryKeys.getSettings,
    enabled: !isDemo,
  })

  const settings: AppSettings | undefined = isDemo ? demoSettings : data?.body

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<AppSettings>) => {
      if (isDemo) {
        throw new Error(DEMO_ERROR_MESSAGE)
      }

      const result = await tsr.settings.update.mutate({ body: updates })
      if (result.status !== 200) {
        throw new Error('Failed to update settings')
      }
      return result.body
    },
    onMutate: async (updates) => {
      if (isDemo) return { previousSettings: undefined }

      await qc.cancelQueries({ queryKey: QueryKeys.getSettings })
      const previousSettings = qc.getQueryData<{
        status: number
        body: AppSettings
      }>(QueryKeys.getSettings)

      if (previousSettings) {
        qc.setQueryData(QueryKeys.getSettings, {
          ...previousSettings,
          body: { ...previousSettings.body, ...updates },
        })
      }

      return { previousSettings }
    },
    onError: (err, _updates, context) => {
      if (context?.previousSettings) {
        qc.setQueryData(QueryKeys.getSettings, context.previousSettings)
      }
      toast({
        title: 'Demo Mode',
        description: err.message,
        variant: 'destructive',
      })
    },
    onSettled: () => {
      if (!isDemo) {
        qc.invalidateQueries({ queryKey: QueryKeys.getSettings })
      }
    },
  })

  const updateSetting = <K extends keyof Omit<AppSettings, 'userId'>>(
    key: K,
    value: AppSettings[K],
  ) => {
    updateMutation.mutate({ [key]: value })
  }

  const updateVisibility = (field: RankField, visible: boolean) =>
    updateSetting(getIsVisibleKey(field), visible)

  const updateRequired = (field: RankField, required: boolean) =>
    updateSetting(getIsRequiredKey(field), required)

  return {
    settings: settings || { ...DEFAULT_SETTINGS, userId: '' },
    isLoading: isDemo ? false : isLoading,
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

export const getSettings = (): Omit<AppSettings, 'userId'> => {
  const cached = queryClient.getQueryData<{
    status: number
    body: AppSettings
  }>(QueryKeys.getSettings)
  if (cached?.status === 200) {
    return cached.body
  }
  return DEFAULT_SETTINGS
}
