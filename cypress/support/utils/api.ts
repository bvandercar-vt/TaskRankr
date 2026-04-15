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
const getApiTasks = () =>
  cy
    .request<Task[]>(
      'GET',
      isLoggedIn() ? ApiPaths.GET_TASKS : TestPaths.TEST_TASKS,
    )
    .its('body')

const getLocalStateTasks = () =>
  cy.window().then<Task[]>((win) => {
    const storageMode = isLoggedIn() ? 'auth' : 'guest'
    const localStateTasksKey = `taskrankr-${storageMode}-tasks`
    const storedTasks = win.localStorage.getItem(localStateTasksKey)

    if (!storedTasks) return []

    return JSON.parse(storedTasks)
  })

export function checkTaskExistsBackend(
  task: Pick<Task, 'name' | 'status'>,
  exists: true,
): void
export function checkTaskExistsBackend(
  task: Pick<Task, 'name'>,
  exists: false,
): void
export function checkTaskExistsBackend(
  task: Pick<Task, 'name'> | Pick<Task, 'name' | 'status'>,
  exists: boolean,
): void {
  const loggedIn = isLoggedIn()
  
  const checkTasks = (tasks: Task[], message: string) => {
    if (exists) {
      expect(
        tasks.map((t) => t.name),
        `task names in ${message}`,
      ).to.include(task.name)
      const tasksInBackend = tasks.filter((t) => t.name === task.name)
      expect(
        tasksInBackend,
        `tasks with name "${task.name}" in ${message}`,
      ).to.have.length(1)
      expect(
        tasksInBackend[0],
        `Task "${task.name}" should exist in ${message} with correct props`,
      ).to.include(task)
    } else {
      expect(
        tasks.map((t) => t.name),
        `task names in ${message}`,
      ).to.not.include(task.name)
    }
  }

  getLocalStateTasks().should((tasks) => checkTasks(tasks, 'local state'))
  loggedIn && getApiTasks().then((tasks) => checkTasks(tasks, 'backend'))
}

export const getSettings = () =>
  cy.request<UserSettings>('GET', ApiPaths.GET_SETTINGS).its('body')
