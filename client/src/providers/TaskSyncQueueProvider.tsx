/**
 * @fileoverview Task sync queue (append-only log of operations bound for the
 * server). Lives in its own provider so queue mutations — which happen on
 * every task change AND every flush tick — don't re-render the task context
 * consumers (Home, TaskCard, etc.).
 *
 * Owned operations:
 *   - Push: mutators in `LocalStateProvider` call `enqueue`/`enqueueMany`.
 *   - Drain: `SyncProvider` reads `syncQueue`, sends ops, then calls
 *     `removeProcessedOperations(successCount)`.
 *   - Temp-id fixup: after a CREATE_TASK succeeds, the queue's tempIds get
 *     rewritten to real ids via `replaceTempIdInQueue`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { getStorageKeys, type StorageMode, storage } from '@/lib/storage'
import type { TaskStatus } from '~/shared/schema'
import type { CreateTaskContent, UpdateTaskContent } from './LocalStateProvider'

export enum SyncOperationType {
  CREATE_TASK = 'create_task',
  UPDATE_TASK = 'update_task',
  SET_STATUS = 'set_status',
  DELETE_TASK = 'delete_task',
  REORDER_SUBTASKS = 'reorder_subtasks',
}

export type SyncOperation =
  | {
      type: SyncOperationType.CREATE_TASK
      tempId: number
      data: CreateTaskContent
    }
  | { type: SyncOperationType.UPDATE_TASK; id: number; data: UpdateTaskContent }
  | { type: SyncOperationType.SET_STATUS; id: number; status: TaskStatus }
  | { type: SyncOperationType.DELETE_TASK; id: number }
  | {
      type: SyncOperationType.REORDER_SUBTASKS
      parentId: number
      orderedIds: number[]
    }

interface TaskSyncQueueContextValue {
  syncQueue: SyncOperation[]
  enqueue: (op: SyncOperation) => void
  enqueueMany: (ops: SyncOperation[]) => void
  clearSyncQueue: () => void
  removeProcessedOperations: (count: number) => void
  replaceTempIdInQueue: (tempId: number, realId: number) => void
}

const TaskSyncQueueContext = createContext<TaskSyncQueueContextValue | null>(
  null,
)

interface TaskSyncQueueProviderProps {
  children: React.ReactNode
  shouldSync: boolean
  storageMode: StorageMode
}

export const TaskSyncQueueProvider = ({
  children,
  shouldSync,
  storageMode,
}: TaskSyncQueueProviderProps) => {
  const storageKeys = useMemo(() => getStorageKeys(storageMode), [storageMode])

  // Synchronous load so the queue is populated before any consumer (including
  // LocalStateProvider's init effect running recovery) observes it.
  const [syncQueue, setSyncQueue] = useState<SyncOperation[]>(() =>
    storage.get<SyncOperation[]>(storageKeys.syncQueue, []),
  )

  useEffect(() => {
    storage.set(storageKeys.syncQueue, syncQueue)
  }, [syncQueue, storageKeys])

  const enqueue = useCallback(
    (op: SyncOperation) => {
      if (!shouldSync) return
      setSyncQueue((prev) => [...prev, op])
    },
    [shouldSync],
  )

  const enqueueMany = useCallback(
    (ops: SyncOperation[]) => {
      if (!shouldSync || ops.length === 0) return
      setSyncQueue((prev) => [...prev, ...ops])
    },
    [shouldSync],
  )

  const clearSyncQueue = useCallback(() => {
    setSyncQueue([])
  }, [])

  const removeProcessedOperations = useCallback((count: number) => {
    if (count <= 0) return
    setSyncQueue((prev) => prev.slice(count))
  }, [])

  const replaceTempIdInQueue = useCallback((tempId: number, realId: number) => {
    setSyncQueue((prev) =>
      prev.map((op) => {
        if (op.type === SyncOperationType.CREATE_TASK) {
          if (op.tempId === tempId) return { ...op, tempId: realId }
          if (op.data.parentId === tempId)
            return { ...op, data: { ...op.data, parentId: realId } }
          return op
        }
        if (op.type === SyncOperationType.REORDER_SUBTASKS) {
          return {
            ...op,
            parentId: op.parentId === tempId ? realId : op.parentId,
            orderedIds: op.orderedIds.map((oid) =>
              oid === tempId ? realId : oid,
            ),
          }
        }
        if ('id' in op && op.id === tempId) {
          return { ...op, id: realId }
        }
        return op
      }),
    )
  }, [])

  const value = useMemo<TaskSyncQueueContextValue>(
    () => ({
      syncQueue,
      enqueue,
      enqueueMany,
      clearSyncQueue,
      removeProcessedOperations,
      replaceTempIdInQueue,
    }),
    [
      syncQueue,
      enqueue,
      enqueueMany,
      clearSyncQueue,
      removeProcessedOperations,
      replaceTempIdInQueue,
    ],
  )

  return (
    <TaskSyncQueueContext.Provider value={value}>
      {children}
    </TaskSyncQueueContext.Provider>
  )
}

export const useTaskSyncQueue = () => {
  const ctx = useContext(TaskSyncQueueContext)
  if (!ctx)
    throw new Error(
      'useTaskSyncQueue must be used within a TaskSyncQueueProvider',
    )
  return ctx
}
