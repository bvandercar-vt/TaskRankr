import { useMutation, useQueryClient } from '@tanstack/react-query'

import { tsr } from '@/lib/api-client'
import { queryClient } from '@/lib/queryClient'
import type { SortOption, UserSettings } from '~/shared/schema'

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

export const useSettings = () => {
  const qc = useQueryClient()
  const { data, isLoading } = tsr.settings.get.useQuery({
    queryKey: ['settings'],
  })

  const settings: AppSettings | undefined =
    data?.status === 200 ? (data.body as AppSettings) : undefined

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<AppSettings>) => {
      const result = await tsr.settings.update.mutate({ body: updates })
      if (result.status !== 200) {
        throw new Error('Failed to update settings')
      }
      return result.body
    },
    onMutate: async (updates) => {
      await qc.cancelQueries({ queryKey: ['settings'] })
      const previousSettings = qc.getQueryData<{
        status: number
        body: AppSettings
      }>(['settings'])

      if (previousSettings) {
        qc.setQueryData(['settings'], {
          ...previousSettings,
          body: { ...previousSettings.body, ...updates },
        })
      }

      return { previousSettings }
    },
    onError: (_err, _updates, context) => {
      if (context?.previousSettings) {
        qc.setQueryData(['settings'], context.previousSettings)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const updateSetting = <K extends keyof Omit<AppSettings, 'userId'>>(
    key: K,
    value: AppSettings[K],
  ) => {
    updateMutation.mutate({ [key]: value })
  }

  return {
    settings: settings || { ...DEFAULT_SETTINGS, userId: '' },
    isLoading,
    updateSetting,
  }
}

export const getSettings = (): Omit<AppSettings, 'userId'> => {
  const cached = queryClient.getQueryData<{
    status: number
    body: AppSettings
  }>(['settings'])
  if (cached?.status === 200) {
    return cached.body
  }
  return DEFAULT_SETTINGS
}
