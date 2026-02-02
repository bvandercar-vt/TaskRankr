import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getSettings } from '@/hooks/use-settings'
import { useToast } from '@/hooks/use-toast'
import { apiRequest } from '@/lib/queryClient'
import { api, buildUrl, type TaskInput } from '~/shared/routes'
import type { TaskStatus } from '~/shared/schema'

// Fetch all tasks
export const useTasks = () => {
  return useQuery({
    queryKey: [api.tasks.list.path],
    queryFn: async () => {
      const res = await apiRequest('GET', api.tasks.list.path)
      return api.tasks.list.responses[200].parse(await res.json())
    },
  })
}

// Custom hook to get parent chain for a task
export const useTaskParentChain = (parentId?: number) => {
  const { data: tasks } = useTasks()

  if (!parentId || !tasks) return []

  const chain: { id: number; name: string }[] = []
  let currentId: number | null | undefined = parentId

  while (currentId) {
    const parent = tasks.find((t) => t.id === currentId)
    if (parent) {
      chain.unshift({ id: parent.id, name: parent.name })
      currentId = parent.parentId
    } else {
      break
    }
  }

  return chain
}

// Fetch single task
export const useTask = (id: number) => {
  return useQuery({
    queryKey: [api.tasks.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.tasks.get.path, { id })
      try {
        const res = await apiRequest('GET', url)
        return api.tasks.get.responses[200].parse(await res.json())
      } catch (e) {
        if (e instanceof Error && e.message.startsWith('404:')) return null
        throw e
      }
    },
    enabled: !!id,
  })
}

// Create a new task
export const useCreateTask = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: TaskInput) => {
      const res = await apiRequest(api.tasks.create.method, api.tasks.create.path, data)
      const task = api.tasks.create.responses[201].parse(await res.json())

      // Auto-pin new task if setting is enabled
      const settings = getSettings()
      if (settings.autoPinNewTasks) {
        try {
          const pinUrl = buildUrl(api.tasks.setStatus.path, { id: task.id })
          await apiRequest(api.tasks.setStatus.method, pinUrl, { status: 'pinned' })
        } catch (e) {
          console.error('Failed to auto-pin task:', e)
        }
      }

      return task
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Update a task
export const useUpdateTask = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: number } & Partial<TaskInput>) => {
      const url = buildUrl(api.tasks.update.path, { id })
      const res = await apiRequest(api.tasks.update.method, url, updates)
      return api.tasks.update.responses[200].parse(await res.json())
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] })
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Set task status
export const useSetTaskStatus = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: TaskStatus }) => {
      const url = buildUrl(api.tasks.setStatus.path, { id })
      const res = await apiRequest(api.tasks.setStatus.method, url, { status })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Delete a task (for actual deletion if ever needed)
export const useDeleteTask = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.tasks.delete.path, { id })
      await apiRequest(api.tasks.delete.method, url)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}
