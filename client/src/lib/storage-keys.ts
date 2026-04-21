/**
 * @fileoverview Shared localStorage key conventions and load helper.
 * Used by all providers that persist per-user state (tasks, settings,
 * expanded-tree, etc.) so the key namespace stays consistent across modes.
 */

export enum StorageMode {
  AUTH = 'auth',
  GUEST = 'guest',
}

export const getStorageKeys = (mode: StorageMode) =>
  ({
    tasks: `taskrankr-${mode}-tasks`,
    settings: `taskrankr-${mode}-settings`,
    nextId: `taskrankr-${mode}-next-id`,
    syncQueue: `taskrankr-${mode}-sync-queue`,
    demoTaskIds: `taskrankr-${mode}-demo-task-ids`,
    expanded: `taskrankr-${mode}-expanded`,
  }) as const

export const loadFromStorageJson = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return fallback
    return JSON.parse(stored)
  } catch {
    return fallback
  }
}
