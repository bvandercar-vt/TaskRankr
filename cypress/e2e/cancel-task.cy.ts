import { Routes } from '@client/lib/constants'
import { ApiPaths, DefaultTask, Selectors } from '@cypress/support/constants'
import { checkTaskExistsBackend } from '@cypress/support/utils/api'
import { isLoggedIn, runBothModes } from '@cypress/support/utils/test-runner'
import {
  fillTaskForm,
  maybeWaitForCreate,
  submitTaskForm,
  type TaskFormData,
} from '@cypress/support/utils/task-form'

const { TaskForm } = Selectors

const parentTask = {
  ...DefaultTask,
  name: 'E2E Cancel Parent Task',
} as const satisfies TaskFormData

const subtask = {
  ...DefaultTask,
  name: 'E2E Cancel Subtask',
} as const satisfies TaskFormData

/**
 * Sets up a DELETE intercept and returns a function that waits for it.
 * Only active in logged-in mode — in guest mode the delete is local-only.
 */
const interceptDelete = () => {
  if (isLoggedIn()) {
    cy.intercept('DELETE', ApiPaths.DELETE_TASK).as('deleteTask')
  }
}

const waitForDelete = () => {
  if (isLoggedIn()) {
    cy.wait('@deleteTask')
  }
}

describe('Task Creation Cancellation', () => {
  beforeEach(() => {
    const loggedIn = isLoggedIn()
    cy.visit(loggedIn ? Routes.HOME : Routes.GUEST)
  })

  runBothModes(
    'cancel on create form before adding any subtask — dialog closes, no task created',
    () => {
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(parentTask)

      cy.get(TaskForm.CANCEL_BTN).click()

      cy.get(TaskForm.NAME_INPUT).should('not.exist')
      cy.contains(parentTask.name).should('not.exist')
      checkTaskExistsBackend(parentTask, false)
    },
  )

  runBothModes(
    'cancel on parent form after a subtask was created — parent and subtask are deleted',
    () => {
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(parentTask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      maybeWaitForCreate(parentTask)

      fillTaskForm(subtask)
      submitTaskForm(subtask)

      cy.get(TaskForm.SUBTASK_ROW).should('have.length', 1)

      interceptDelete()
      cy.get(TaskForm.CANCEL_BTN).click()
      waitForDelete()

      cy.get(TaskForm.NAME_INPUT).should('not.exist')
      cy.contains(parentTask.name).should('not.exist')
      cy.contains(subtask.name).should('not.exist')
      checkTaskExistsBackend(parentTask, false)
      checkTaskExistsBackend(subtask, false)
    },
  )

  runBothModes(
    'cancel on subtask form navigates back to parent, then cancel on parent deletes it',
    () => {
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(parentTask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      maybeWaitForCreate(parentTask)

      cy.get(TaskForm.NAME_INPUT).type(subtask.name)
      cy.get(TaskForm.CANCEL_BTN).click()

      cy.get(TaskForm.NAME_INPUT).should('have.value', parentTask.name)

      interceptDelete()
      cy.get(TaskForm.CANCEL_BTN).click()
      waitForDelete()

      cy.get(TaskForm.NAME_INPUT).should('not.exist')
      cy.contains(parentTask.name).should('not.exist')
      checkTaskExistsBackend(parentTask, false)
    },
  )

  runBothModes(
    'cancel on parent form after multiple subtasks were created — all are deleted',
    () => {
      const subtask2 = {
        ...DefaultTask,
        name: 'E2E Cancel Subtask 2',
      } as const satisfies TaskFormData

      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(parentTask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      maybeWaitForCreate(parentTask)

      fillTaskForm(subtask)
      submitTaskForm(subtask)
      cy.get(TaskForm.SUBTASK_ROW).should('have.length', 1)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      fillTaskForm(subtask2)
      submitTaskForm(subtask2)
      cy.get(TaskForm.SUBTASK_ROW).should('have.length', 2)

      interceptDelete()
      cy.get(TaskForm.CANCEL_BTN).click()
      waitForDelete()

      cy.get(TaskForm.NAME_INPUT).should('not.exist')
      cy.contains(parentTask.name).should('not.exist')
      cy.contains(subtask.name).should('not.exist')
      cy.contains(subtask2.name).should('not.exist')
      checkTaskExistsBackend(parentTask, false)
      checkTaskExistsBackend(subtask, false)
      checkTaskExistsBackend(subtask2, false)
    },
  )
})
