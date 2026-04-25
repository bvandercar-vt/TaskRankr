import type { Task } from '~/shared/schema'

/**
 * Stable React identity that survives the temp-id → real-id swap on task
 * creation. Never persisted to the DB or sent over the wire — assigned at
 * every entry boundary into client state (storage, server fetch, demo seed,
 * local mint).
 */
export type LocalTask = Task & { clientKey: string }

export type TaskWithSubtasks = LocalTask & { subtasks: TaskWithSubtasks[] }
