import { contract } from '@src/contract'
import {
  Ease,
  Enjoyment,
  Priority,
  type Task,
  Time,
} from '@src/schema/tasks.zod'

export * from './selectors'

export const ApiPaths = {
  GET_TASKS: contract.tasks.get.path,
  CREATE_TASK: contract.tasks.create.path,
}

export const DefaultTask = {
  name: 'E2E Test Task',
  priority: Priority.HIGH,
  ease: Ease.MEDIUM,
  enjoyment: Enjoyment.LOW,
  time: Time.HIGH,
} as const satisfies Partial<Task>
