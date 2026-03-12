import { contract } from '~/shared/contract'
import { Ease, Enjoyment, Priority, type Task, Time } from '~/shared/schema'

export * from './selectors'

export const ApiPaths = {
  GET_TASKS: contract.tasks.list.path,
  CREATE_TASK: contract.tasks.create.path,
}

export const DefaultTask = {
  name: 'E2E Test Task',
  priority: Priority.HIGH,
  ease: Ease.MEDIUM,
  enjoyment: Enjoyment.LOW,
  time: Time.HIGH,
} as const satisfies Partial<Task>
