import {
  Ease,
  Enjoyment,
  Priority,
  type Task,
  Time,
} from '@src/schema/tasks.zod'

export * from './selectors'

export const DEFAULT_TASK = {
  name: 'E2E Test Task',
  priority: Priority.HIGH,
  ease: Ease.MEDIUM,
  enjoyment: Enjoyment.LOW,
  time: Time.HIGH,
} as const satisfies Partial<Task>
