/**
 * @fileoverview Shared localStorage key conventions and helpers.
 * Used by all providers that persist per-user state (tasks, settings,
 * expanded-tree, etc.) so the key namespace stays consistent across modes.
 */

import type { Jsonifiable } from 'type-fest'

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

export const storage = {
  set(key: string, value: Jsonifiable) {
    // Automatically JSON stringify
    localStorage.setItem(key, JSON.stringify(value))
  },
  get<T extends Jsonifiable>(key: string, fallback: T): T {
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return fallback
      return JSON.parse(stored)
    } catch {
      return fallback
    }
  },
  remove(key: string) {
    localStorage.removeItem(key)
  },
}
