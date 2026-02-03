import { useMutation, useQuery } from '@tanstack/react-query'

import { apiRequest, queryClient } from '@/lib/queryClient'
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
  const { data: settings, isLoading } = useQuery<AppSettings>({
    queryKey: ['/api/settings'],
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<AppSettings>) => {
      const res = await apiRequest('PUT', '/api/settings', updates)
      return res.json()
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/settings'] })

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<AppSettings>([
        '/api/settings',
      ])

      // Optimistically update
      if (previousSettings) {
        queryClient.setQueryData<AppSettings>(['/api/settings'], {
          ...previousSettings,
          ...updates,
        })
      }

      return { previousSettings }
    },
    onError: (_err, _updates, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(['/api/settings'], context.previousSettings)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] })
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
  const cached = queryClient.getQueryData<AppSettings>(['/api/settings'])
  return cached || DEFAULT_SETTINGS
}
