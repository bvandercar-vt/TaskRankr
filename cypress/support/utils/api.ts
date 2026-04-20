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

export function checkTasksExistBackend(
  tasks: Pick<Task, 'name' | 'status'>[],
  exists: true,
): void
export function checkTasksExistBackend(
  tasks: Pick<Task, 'name'>[],
  exists: false,
): void
export function checkTasksExistBackend(
  tasks: Pick<Task, 'name'>[] | Pick<Task, 'name' | 'status'>[],
  exists: boolean,
): void {
  const loggedIn = isLoggedIn()

  const expectedTaskNames = tasks.map((t) => t.name)
  const checkTasks = (givenTasks: Task[], message: string) => {
    if (exists) {
      expect(
        givenTasks.map((t) => t.name),
        `task names in ${message}`,
      ).to.include.members(expectedTaskNames)
      expect(givenTasks, 'no duplicate tasks').to.have.length(
        Cypress._.uniqBy(givenTasks, (t) => t.name).length,
      )
      for (const expectedTask of tasks) {
        const givenTask = givenTasks.find((t) => t.name === expectedTask.name)
        expect(
          givenTask,
          `Task "${expectedTask.name}" exists in ${message} with correct props`,
        ).to.include(expectedTask)
      }
    } else {
      expect(
        givenTasks.reduce((running: Record<string, Task>, curr) => {
          running[curr.name] = curr
          return running
        }, {}), `tasks do not exist in ${message}`,
      ).to.not.include.any.keys(expectedTaskNames)
    }
  }

  getLocalStateTasks().should((givenTasks) =>
    checkTasks(givenTasks, 'local state'),
  )
  if (loggedIn || !exists) {
    getApiTasks().then((givenTasks) => checkTasks(givenTasks, 'backend'))
  }
}

export const getSettings = () =>
  cy.request<UserSettings>('GET', ApiPaths.GET_SETTINGS).its('body')
