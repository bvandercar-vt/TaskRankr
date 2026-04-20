import type { RankField, Task } from '~/shared/schema'
import { ApiPaths } from '../constants'
import { checkTasksExistBackend } from './api'
import { isLoggedIn } from './test-runner'

export const interceptCreate = () => {
  cy.intercept('POST', ApiPaths.CREATE_TASK).as('createTask')
}

export type CreatedTask = Pick<Task, 'name' | 'status' | RankField>

export function waitForCreate(tasks: CreatedTask[]): void {
  const loggedIn = isLoggedIn()
  loggedIn && cy.wait(Array(tasks.length).fill('@createTask'))
  checkTasksExistBackend(tasks, true)
}

export const interceptDelete = () => {
  cy.intercept('DELETE', ApiPaths.DELETE_TASK).as('deleteTask')
}

export const waitForDelete = (task: Pick<Task, 'name'>) => {
  const loggedIn = isLoggedIn()
  loggedIn && cy.wait('@deleteTask')
  checkTasksExistBackend([task], false)
}

export const interceptUpdate = () => {
  cy.intercept('PUT', ApiPaths.UPDATE_TASK).as('updateTask')
}

export const waitForUpdate = (task: CreatedTask) => {
  const loggedIn = isLoggedIn()
  loggedIn && cy.wait('@updateTask')
  checkTasksExistBackend([task], true)
}

export const checkNumCalls = ({
  create,
  update,
}: {
  create?: number
  update?: number
}) => {
  const loggedIn = isLoggedIn()
  if (create !== undefined) {
    cy.get('@createTask.all').should('have.length', loggedIn ? create : 0)
  }
  if (update !== undefined) {
    cy.get('@updateTask.all').should('have.length', loggedIn ? update : 0)
  }
}
