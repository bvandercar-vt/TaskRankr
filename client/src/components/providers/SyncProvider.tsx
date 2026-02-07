/**
 * @fileoverview Background sync provider for server synchronization.
 * Processes sync queue from LocalStateProvider when online and authenticated.
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { tsr } from '@/lib/ts-rest'
import type { Task, TaskWithSubtasks } from '~/shared/schema'
import { useLocalState } from './LocalStateProvider'

const buildTaskTree = (flatTasks: Task[]): TaskWithSubtasks[] => {
  const taskMap = new Map<number, TaskWithSubtasks>()
  const rootTasks: TaskWithSubtasks[] = []

  for (const task of flatTasks) {
    taskMap.set(task.id, { ...task, subtasks: [] })
  }

  for (const task of flatTasks) {
    const taskWithSubs = taskMap.get(task.id)
    if (!taskWithSubs) continue
    if (task.parentId && taskMap.has(task.parentId)) {
      taskMap.get(task.parentId)?.subtasks.push(taskWithSubs)
    } else {
      rootTasks.push(taskWithSubs)
    }
  }

  return rootTasks
}

interface SyncContextValue {
  isSyncing: boolean
  isOnline: boolean
  pendingCount: number
  lastSyncError: string | null
  forceSync: () => Promise<void>
}

const SyncContext = createContext<SyncContextValue | null>(null)

interface SyncProviderProps {
  children: ReactNode
  isAuthenticated: boolean
}

export const SyncProvider = ({
  children,
  isAuthenticated,
}: SyncProviderProps) => {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastSyncError, setLastSyncError] = useState<string | null>(null)
  const isSyncingRef = useRef(false)
  const hasLoadedServerData = useRef(false)

  const {
    syncQueue,
    removeSyncOperation,
    clearSyncQueue,
    replaceTaskId,
    setTasksFromServer,
    setSettingsFromServer,
    isInitialized,
  } = useLocalState()

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadServerData = useCallback(async () => {
    if (!isAuthenticated || !isOnline || hasLoadedServerData.current) return
    if (syncQueue.length > 0) return

    try {
      const [tasksResult, settingsResult] = await Promise.all([
        tsr.tasks.list.query(),
        tsr.settings.get.query(),
      ])

      if (tasksResult.status === 200) {
        setTasksFromServer(buildTaskTree(tasksResult.body))
      }
      if (settingsResult.status === 200) {
        setSettingsFromServer(settingsResult.body)
      }

      hasLoadedServerData.current = true
    } catch (err) {
      console.error('Failed to load server data:', err)
    }
  }, [
    isAuthenticated,
    isOnline,
    syncQueue.length,
    setTasksFromServer,
    setSettingsFromServer,
  ])

  useEffect(() => {
    if (
      isAuthenticated &&
      isOnline &&
      isInitialized &&
      !hasLoadedServerData.current &&
      syncQueue.length === 0
    ) {
      // biome-ignore lint/nursery/noFloatingPromises: from replit, TODO: investigate
      loadServerData()
    }
  }, [
    isAuthenticated,
    isOnline,
    isInitialized,
    syncQueue.length,
    loadServerData,
  ])

  useEffect(() => {
    if (!isAuthenticated) {
      hasLoadedServerData.current = false
    }
  }, [isAuthenticated])

  const flushQueue = useCallback(async () => {
    if (isSyncingRef.current || !isOnline || !isAuthenticated) return
    if (syncQueue.length === 0) return

    isSyncingRef.current = true
    setIsSyncing(true)
    setLastSyncError(null)

    const queueSnapshot = [...syncQueue]
    const idMap = new Map<number, number>()

    const resolveId = (id: number): number => idMap.get(id) ?? id

    try {
      let successCount = 0
      for (const op of queueSnapshot) {
        let success = false

        switch (op.type) {
          case 'create_task': {
            const result = await tsr.tasks.create.mutate({ body: op.data })
            if (result.status === 201) {
              idMap.set(op.tempId, result.body.id)
              replaceTaskId(op.tempId, result.body.id)
              success = true
            }
            break
          }
          case 'update_task': {
            const realId = resolveId(op.id)
            if (realId < 0) {
              success = true
              break
            }
            const result = await tsr.tasks.update.mutate({
              params: { id: realId },
              body: op.data,
            })
            success = result.status === 200
            break
          }
          case 'set_status': {
            const realId = resolveId(op.id)
            if (realId < 0) {
              success = true
              break
            }
            const result = await tsr.tasks.setStatus.mutate({
              params: { id: realId },
              body: { status: op.status },
            })
            success = result.status === 200
            break
          }
          case 'delete_task': {
            const realId = resolveId(op.id)
            if (realId < 0) {
              success = true
              break
            }
            const result = await tsr.tasks.delete.mutate({
              params: { id: realId },
            })
            success = result.status === 204
            break
          }
          case 'update_settings': {
            const result = await tsr.settings.update.mutate({ body: op.data })
            success = result.status === 200
            break
          }
          case 'reorder_subtasks': {
            const realParentId = resolveId(op.parentId)
            if (realParentId < 0) {
              success = true
              break
            }
            const realOrderedIds = op.orderedIds.map((id) => resolveId(id))
            const result = await tsr.tasks.reorderSubtasks.mutate({
              params: { id: realParentId },
              body: { orderedIds: realOrderedIds },
            })
            success = result.status === 200
            break
          }
          default:
            success = true
        }

        if (success) {
          successCount++
        } else {
          setLastSyncError(`Failed to sync: ${op.type}`)
          break
        }
      }

      if (successCount === queueSnapshot.length) {
        clearSyncQueue()
      } else if (successCount > 0) {
        for (let i = 0; i < successCount; i++) {
          removeSyncOperation(0)
        }
      }
    } catch (err) {
      console.error('Sync failed:', err)
      setLastSyncError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)
    }
  }, [
    syncQueue,
    isOnline,
    isAuthenticated,
    replaceTaskId,
    removeSyncOperation,
    clearSyncQueue,
  ])

  useEffect(() => {
    if (
      isOnline &&
      isAuthenticated &&
      syncQueue.length > 0 &&
      !isSyncingRef.current
    ) {
      const timer = setTimeout(flushQueue, 500)
      return () => clearTimeout(timer)
    }
  }, [syncQueue, isOnline, isAuthenticated, flushQueue])

  const forceSync = useCallback(async () => {
    await flushQueue()
  }, [flushQueue])

  const value = useMemo(
    () => ({
      isSyncing,
      isOnline,
      pendingCount: syncQueue.length,
      lastSyncError,
      forceSync,
    }),
    [isSyncing, isOnline, syncQueue.length, lastSyncError, forceSync],
  )

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

export const useSync = () => {
  const context = useContext(SyncContext)
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider')
  }
  return context
}

export const useSyncSafe = () => {
  return useContext(SyncContext)
}
