import type { Task } from '~/shared/schema'
import { ApiPaths } from '../constants'

export const getTasks = () =>
  cy.request<Task[]>('GET', ApiPaths.GET_TASKS).its('body')
