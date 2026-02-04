/**
 * @fileoverview Task CRUD operations hooks
 * 
 * Provides React hooks for task management including listing, creating,
 * updating, deleting tasks, and setting task status. Includes cache
 * invalidation and toast notifications for error handling.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getSettings } from '@/hooks/use-settings'
import { useToast } from '@/hooks/use-toast'
import { type ClientInferRequestBody, QueryKeys, tsr } from '@/lib/ts-rest'
import type { contract } from '~/shared/contract'
import type { TaskStatus, UpdateTaskRequest } from '~/shared/schema'

export const useTasks = () => {
  const query = tsr.tasks.list.useQuery({
    queryKey: QueryKeys.getTasks,
  })

  return {
    data: query.data?.status === 200 ? query.data.body : undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

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

export const useTask = (id: number) => {
  const query = tsr.tasks.get.useQuery({
    queryKey: [...QueryKeys.getTasks, id],
    queryData: { params: { id } },
    enabled: !!id,
  })

  return {
    data: query.data?.status === 200 ? query.data.body : undefined,
    isLoading: query.isLoading,
    error: query.error,
  }
}

export const useCreateTask = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (
      data: Omit<
        ClientInferRequestBody<typeof contract.tasks.create>,
        'userId'
      >,
    ) => {
      const result = await tsr.tasks.create.mutate({ body: data })
      if (result.status !== 201) {
        throw new Error(result.body.message)
      }

      const settings = getSettings()
      if (settings.autoPinNewTasks) {
        try {
          await tsr.tasks.setStatus.mutate({
            params: { id: result.body.id },
            body: { status: 'pinned' },
          })
        } catch (e) {
          console.error('Failed to auto-pin task:', e)
        }
      }

      return result.body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.getTasks })
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

export const useUpdateTask = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: number } & UpdateTaskRequest) => {
      const result = await tsr.tasks.update.mutate({
        params: { id },
        body: updates,
      })
      if (result.status !== 200) {
        throw new Error(result.body.message)
      }
      return result.body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.getTasks })
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

export const useSetTaskStatus = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: TaskStatus }) => {
      const result = await tsr.tasks.setStatus.mutate({
        params: { id },
        body: { status },
      })
      if (result.status !== 200) {
        throw new Error(result.body.message)
      }
      return result.body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.getTasks })
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

export const useDeleteTask = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await tsr.tasks.delete.mutate({
        params: { id },
      })
      if (result.status !== 204) {
        throw new Error(result.body.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.getTasks })
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
