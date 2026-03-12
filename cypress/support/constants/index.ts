import { contract } from '~/shared/contract'
import {
  Ease,
  Enjoyment,
  type FieldConfig,
  Priority,
  type Task,
  Time,
} from '~/shared/schema'

export * from './selectors'

export const ApiPaths = {
  GET_TASKS: contract.tasks.list.path,
  CREATE_TASK: contract.tasks.create.path,
  GET_SETTINGS: contract.settings.get.path,
  UPDATE_SETTINGS: contract.settings.update.path,
}

export const DefaultTask = {
  name: 'E2E Test Task',
  priority: Priority.HIGH,
  ease: Ease.MEDIUM,
  enjoyment: Enjoyment.LOW,
  time: Time.HIGH,
} as const satisfies Partial<Task>

export const SettingsAllVisbileAllRequired = {
  priority: { visible: true, required: true },
  ease: { visible: true, required: false },
  enjoyment: { visible: true, required: false },
  time: { visible: true, required: false },
} as const satisfies FieldConfig
