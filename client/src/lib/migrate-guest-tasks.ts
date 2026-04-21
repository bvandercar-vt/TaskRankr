/**
 * @fileoverview Guest task migration utilities.
 * Migrates guest mode tasks to authenticated storage on login.
 */

import { omit } from 'es-toolkit'

import { removeIds } from '@/lib/task-utils'
import { SyncOperationType } from '@/providers/TaskSyncQueueProvider'
import type { Task } from '~/shared/schema'
import { storage } from './storage'

const GUEST_STORAGE_KEYS = {
  tasks: 'taskrankr-guest-tasks',
  demoTaskIds: 'taskrankr-guest-demo-task-ids',
  settings: 'taskrankr-guest-settings',
  nextId: 'taskrankr-guest-next-id',
  syncQueue: 'taskrankr-guest-sync-queue',
}

const AUTH_STORAGE_KEYS = {
  tasks: 'taskrankr-auth-tasks',
  syncQueue: 'taskrankr-auth-sync-queue',
  nextId: 'taskrankr-auth-next-id',
}

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
