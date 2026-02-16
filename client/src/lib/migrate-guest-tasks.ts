/**
 * @fileoverview Guest task migration utilities.
 * Migrates guest mode tasks to authenticated storage on login.
 */

import { omit } from 'es-toolkit'

import { SyncOperationType } from '@/providers/LocalStateProvider'
import type { Task } from '~/shared/schema'

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

export const getGuestTasksToMigrate = (): MigrationResult => {
  try {
    const guestTasksRaw = localStorage.getItem(GUEST_STORAGE_KEYS.tasks)
    const demoIdsRaw = localStorage.getItem(GUEST_STORAGE_KEYS.demoTaskIds)

    if (!guestTasksRaw) {
      return { migratedCount: 0, tasks: [] }
    }

    const guestTasks: Task[] = JSON.parse(guestTasksRaw)
    const demoIds: number[] = demoIdsRaw ? JSON.parse(demoIdsRaw) : []
    const demoIdSet = new Set(demoIds)

    const userCreatedTasks = guestTasks.filter(
      (task) => !demoIdSet.has(task.id),
    )

    return {
      migratedCount: userCreatedTasks.length,
      tasks: userCreatedTasks,
    }
  } catch {
    return { migratedCount: 0, tasks: [] }
  }
}

export const migrateGuestTasksToAuth = (): MigrationResult => {
  const { tasks: userCreatedTasks, migratedCount } = getGuestTasksToMigrate()

  if (userCreatedTasks.length === 0) {
    return { migratedCount: 0, tasks: [] }
  }

  try {
    const existingAuthTasksRaw = localStorage.getItem(AUTH_STORAGE_KEYS.tasks)
    const existingAuthTasks: Task[] = existingAuthTasksRaw
      ? JSON.parse(existingAuthTasksRaw)
      : []

    const existingSyncQueueRaw = localStorage.getItem(
      AUTH_STORAGE_KEYS.syncQueue,
    )
    const existingSyncQueue = existingSyncQueueRaw
      ? JSON.parse(existingSyncQueueRaw)
      : []

    const existingNextIdRaw = localStorage.getItem(AUTH_STORAGE_KEYS.nextId)
    let nextId = existingNextIdRaw ? JSON.parse(existingNextIdRaw) : -1

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
        data: {
          ...omit(task, ['id', 'userId']),
          parentId: newParentId,
        },
      })
    }

    const allTasks = [...existingAuthTasks, ...migratedTasks]
    const allSyncOps = [...existingSyncQueue, ...newSyncOps]

    localStorage.setItem(AUTH_STORAGE_KEYS.tasks, JSON.stringify(allTasks))
    localStorage.setItem(
      AUTH_STORAGE_KEYS.syncQueue,
      JSON.stringify(allSyncOps),
    )
    localStorage.setItem(AUTH_STORAGE_KEYS.nextId, JSON.stringify(nextId))

    return { migratedCount, tasks: migratedTasks }
  } catch (err) {
    console.error('Failed to migrate guest tasks:', err)
    return { migratedCount: 0, tasks: [] }
  }
}

export const clearGuestStorage = () => {
  localStorage.removeItem(GUEST_STORAGE_KEYS.tasks)
  localStorage.removeItem(GUEST_STORAGE_KEYS.demoTaskIds)
  localStorage.removeItem(GUEST_STORAGE_KEYS.settings)
  localStorage.removeItem(GUEST_STORAGE_KEYS.nextId)
  localStorage.removeItem(GUEST_STORAGE_KEYS.syncQueue)
}

export const hasGuestTasksToMigrate = (): boolean => {
  const { migratedCount } = getGuestTasksToMigrate()
  return migratedCount > 0
}
