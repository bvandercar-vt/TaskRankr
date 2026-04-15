import { TaskStatus } from '~/shared/schema'
import { ApiPaths } from '../constants'
import { checkTaskExistsBackend } from './api'
import type { TaskFormData } from './task-form'
import { isLoggedIn } from './test-runner'

export const interceptCreate = () => {
  cy.intercept('POST', ApiPaths.CREATE_TASK).as('createTask')
}

export function waitForCreate({
  status = TaskStatus.PINNED,
  ...task
}: TaskFormData & { status?: TaskStatus }) {
  const loggedIn = isLoggedIn()

  loggedIn && cy.wait('@createTask')

  checkTaskExistsBackend({ ...task, status }, loggedIn as true)
}

export const interceptDelete = () => {
  cy.intercept('DELETE', ApiPaths.DELETE_TASK).as('deleteTask')
}

export const waitForDelete = (task: Pick<TaskFormData, 'name'>) => {
  const loggedIn = isLoggedIn()

  loggedIn && cy.wait('@deleteTask')

  checkTaskExistsBackend(task, false)
}

export const interceptUpdate = () => {
  cy.intercept('PUT', ApiPaths.UPDATE_TASK).as('updateTask')
}

export const waitForUpdate = () => {
  const loggedIn = isLoggedIn()
  loggedIn && cy.wait('@updateTask')
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
    cy.get('@createTask').should('have.been.called', loggedIn ? create : 0)
  }
  if (update !== undefined) {
    cy.get('@updateTask').should('have.been.called', loggedIn ? update : 0)
  }
}
