/**
 * @fileoverview Migrates user-created guest tasks into the auth localStorage
 * bucket on login.
 *
 * Demo tasks are skipped. New temp ids are minted (negative, to match
 * TasksProvider's optimistic-id scheme), the parent/child graph is rewritten
 * in two passes (roots, then children with the remapped parentId), and a
 * matching CREATE_TASK op per task is appended to the auth sync queue so the
 * next sync flush pushes them to the server.
 */

import { omit } from 'es-toolkit'

import { removeIds } from '@/lib/task-tree-utils'
import { SyncOperationType } from '@/providers/TaskSyncQueueProvider'
import type { Task } from '~/shared/schema'
import { getStorageKeys, StorageMode, storage } from './storage'

const GUEST_STORAGE_KEYS = getStorageKeys(StorageMode.GUEST)
const AUTH_STORAGE_KEYS = getStorageKeys(StorageMode.AUTH)

export interface MigrationResult {
  migratedCount: number
  tasks: Task[]
}

const isStorageError = (err: unknown): boolean =>
  err instanceof SyntaxError || err instanceof DOMException

export const getGuestTasksToMigrate = (): MigrationResult => {
  try {
    const guestTasks = storage.get<Task[]>(GUEST_STORAGE_KEYS.tasks, [])
    const demoIds = storage.get<number[]>(GUEST_STORAGE_KEYS.demoTaskIds, [])
    const userCreatedTasks = removeIds(guestTasks, demoIds)

    return {
      migratedCount: userCreatedTasks.length,
      tasks: userCreatedTasks,
    }
  } catch (err) {
    if (isStorageError(err)) return { migratedCount: 0, tasks: [] }
    throw err
  }
}

export const migrateGuestTasksToAuth = (): MigrationResult => {
  const { tasks: userCreatedTasks, migratedCount } = getGuestTasksToMigrate()

  if (userCreatedTasks.length === 0) {
    return { migratedCount: 0, tasks: [] }
  }

  try {
    const existingAuthTasks = storage.get<Task[]>(AUTH_STORAGE_KEYS.tasks, [])
    const existingSyncQueue = storage.get(AUTH_STORAGE_KEYS.syncQueue, [])
    const existingNextId = storage.get(AUTH_STORAGE_KEYS.nextId, -1)
    let nextId = existingNextId

    const idMapping = new Map<number, number>()
    const migratedTasks: Task[] = []
    const newSyncOps: Array<{
      type: SyncOperationType.CREATE_TASK
      tempId: number
      data: Omit<Task, 'id' | 'userId'>
    }> = []

    // Pass 1: roots. Recorded in idMapping so pass 2 can rewrite parentId.
    for (const task of userCreatedTasks) {
      if (task.parentId !== null) continue

      const newId = nextId--
      idMapping.set(task.id, newId)

      const migratedTask: Task = {
        ...task,
        id: newId,
        userId: 'local',
      }
      migratedTasks.push(migratedTask)

      newSyncOps.push({
        type: SyncOperationType.CREATE_TASK,
        tempId: newId,
        data: { ...omit(task, ['id', 'userId']), parentId: null },
      })
    }

    // Pass 2: children. parentId is remapped via the table built in pass 1
    // (falls back to the original id only for orphan rows, which the server
    // self-heals on next read — see DatabaseStorage.getTasks).
    for (const task of userCreatedTasks) {
      if (task.parentId === null) continue

      const newId = nextId--
      const newParentId = idMapping.get(task.parentId) ?? task.parentId

      idMapping.set(task.id, newId)

      const migratedTask: Task = {
        ...task,
        id: newId,
        parentId: newParentId,
        userId: 'local',
      }
      migratedTasks.push(migratedTask)

      newSyncOps.push({
        type: SyncOperationType.CREATE_TASK,
        tempId: newId,
        data: { ...omit(task, ['id', 'userId']), parentId: newParentId },
      })
    }

    const allTasks = [...existingAuthTasks, ...migratedTasks]
    const allSyncOps = [...existingSyncQueue, ...newSyncOps]

    storage.set(AUTH_STORAGE_KEYS.tasks, allTasks)
    storage.set(AUTH_STORAGE_KEYS.syncQueue, allSyncOps)
    storage.set(AUTH_STORAGE_KEYS.nextId, nextId)

    return { migratedCount, tasks: migratedTasks }
  } catch (err) {
    if (isStorageError(err)) {
      console.error('Failed to migrate guest tasks:', err)
      return { migratedCount: 0, tasks: [] }
    }
    throw err
  }
}

export const clearGuestStorage = () => {
  storage.remove(GUEST_STORAGE_KEYS.tasks)
  storage.remove(GUEST_STORAGE_KEYS.demoTaskIds)
  storage.remove(GUEST_STORAGE_KEYS.settings)
  storage.remove(GUEST_STORAGE_KEYS.nextId)
  storage.remove(GUEST_STORAGE_KEYS.syncQueue)
}

export const hasGuestTasksToMigrate = (): boolean => {
  const { migratedCount } = getGuestTasksToMigrate()
  return migratedCount > 0
}
