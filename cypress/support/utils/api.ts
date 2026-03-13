import { TestPaths } from '~/shared/constants'
import type { Task, UserSettings } from '~/shared/schema'
import { ApiPaths } from '../constants'
import { isLoggedIn } from './test-runner'

/**
 * Fetches tasks, routing to the correct endpoint based on session state.
 *
 * Logged in (session cookie present) → GET /api/tasks (real auth middleware).
 * Guest (no cookie) → GET /api/test/tasks (unauthenticated backdoor), used to
 * assert that guest-created tasks are not persisted to the server.
 */
export const getTasks = () =>
  cy
    .request<Task[]>(
      'GET',
      isLoggedIn() ? ApiPaths.GET_TASKS : TestPaths.TEST_TASKS,
    )
    .its('body')

export const checkTaskExistsBackend = (
  task: Pick<Task, 'name'>,
  exists: boolean,
) =>
  getTasks().then((tasks) => {
    if (exists) {
      expect(tasks.map((t) => t.name)).to.include(task.name)
      const taskInBackend = tasks.find((t) => t.name === task.name)
      expect(taskInBackend).to.include(task)
    } else {
      expect(tasks.map((t) => t.name)).to.not.include(task.name)
    }
  })

export const getSettings = () =>
  cy.request<UserSettings>('GET', ApiPaths.GET_SETTINGS).its('body')
