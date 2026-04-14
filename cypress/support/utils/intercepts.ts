import { TaskStatus } from '~/shared/schema'
import { ApiPaths } from '../constants'
import { checkTaskExistsBackend } from './api'
import type { TaskFormData } from './task-form'
import { isLoggedIn } from './test-runner'

export const interceptCreate = () => {
  cy.intercept('POST', ApiPaths.CREATE_TASK).as('createTask')
}

export function waitForCreate({
  status = TaskStatus.OPEN,
  ...task
}: TaskFormData & { status?: TaskStatus }) {
  const loggedIn = isLoggedIn()

  loggedIn && cy.wait('@createTask')

  checkTaskExistsBackend({ ...task, status }, loggedIn as true)

  cy.get('@createTask').should('have.been.called', loggedIn ? 1 : 0)
}

export const interceptDelete = () => {
  cy.intercept('DELETE', ApiPaths.DELETE_TASK).as('deleteTask')
}

export const waitForDelete = () => {
  if (isLoggedIn()) {
    cy.wait('@deleteTask')
  }
}
