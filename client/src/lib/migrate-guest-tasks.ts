import type { TaskResponse } from '~/shared/schema'

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
  tasks: TaskResponse[]
}

export const getGuestTasksToMigrate = (): MigrationResult => {
  try {
    const guestTasksRaw = localStorage.getItem(GUEST_STORAGE_KEYS.tasks)
    const demoIdsRaw = localStorage.getItem(GUEST_STORAGE_KEYS.demoTaskIds)

    if (!guestTasksRaw) {
      return { migratedCount: 0, tasks: [] }
    }

    const guestTasks: TaskResponse[] = JSON.parse(guestTasksRaw)
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
    const existingAuthTasks: TaskResponse[] = existingAuthTasksRaw
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
    const migratedTasks: TaskResponse[] = []
    const newSyncOps: Array<{
      type: 'create_task'
      tempId: number
      data: Omit<TaskResponse, 'id' | 'userId' | 'subtasks'>
    }> = []

    for (const task of userCreatedTasks) {
      if (task.parentId !== null) continue

      const newId = nextId--
      idMapping.set(task.id, newId)

      const migratedTask: TaskResponse = {
        ...task,
        id: newId,
        userId: 'local',
        subtasks: [],
      }
      migratedTasks.push(migratedTask)

      newSyncOps.push({
        type: 'create_task',
        tempId: newId,
        data: {
          name: task.name,
          description: task.description,
          priority: task.priority,
          ease: task.ease,
          enjoyment: task.enjoyment,
          time: task.time,
          parentId: null,
          status: task.status,
          inProgressTime: task.inProgressTime,
          inProgressStartedAt: task.inProgressStartedAt,
          createdAt: task.createdAt,
          completedAt: task.completedAt,
        },
      })
    }

    for (const task of userCreatedTasks) {
      if (task.parentId === null) continue

      const newId = nextId--
      const newParentId = idMapping.get(task.parentId) ?? task.parentId

      idMapping.set(task.id, newId)

      const migratedTask: TaskResponse = {
        ...task,
        id: newId,
        parentId: newParentId,
        userId: 'local',
        subtasks: [],
      }
      migratedTasks.push(migratedTask)

      newSyncOps.push({
        type: 'create_task',
        tempId: newId,
        data: {
          name: task.name,
          description: task.description,
          priority: task.priority,
          ease: task.ease,
          enjoyment: task.enjoyment,
          time: task.time,
          parentId: newParentId,
          status: task.status,
          inProgressTime: task.inProgressTime,
          inProgressStartedAt: task.inProgressStartedAt,
          createdAt: task.createdAt,
          completedAt: task.completedAt,
        },
      })
    }

    const allTasks = [...existingAuthTasks, ...migratedTasks]
    const allSyncOps = [...existingSyncQueue, ...newSyncOps]

    localStorage.setItem(AUTH_STORAGE_KEYS.tasks, JSON.stringify(allTasks))
    localStorage.setItem(AUTH_STORAGE_KEYS.syncQueue, JSON.stringify(allSyncOps))
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
