import type { Task } from '~/shared/schema'

export type TaskWithSubtasks = Task & { subtasks: TaskWithSubtasks[] }
