import { Routes } from '@client/lib/constants'
import { DefaultTask, Selectors } from '@cypress/support/constants'
import { checkTaskExistsBackend } from '@cypress/support/utils/api'
import {
  clickSubmitBtn,
  fillTaskForm,
  type TaskFormData,
} from '@cypress/support/utils/task-form'
import { isLoggedIn, runBothModes } from '@cypress/support/utils/test-runner'

const { TaskForm } = Selectors

const rootTask = {
  ...DefaultTask,
  name: 'E2E Root Task',
} as const satisfies TaskFormData

const subtask = {
  ...DefaultTask,
  name: 'E2E Subtask 1',
} as const satisfies TaskFormData

const subtask2 = {
  ...DefaultTask,
  name: 'E2E Subtask 2',
} as const satisfies TaskFormData

const checkDoNotExist = (tasks: TaskFormData[]) => {
  tasks.forEach((task) => {
    cy.contains(task.name).should('not.exist')
    checkTaskExistsBackend(task, false)
  })
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
      fillTaskForm(rootTask)

      cy.get(TaskForm.CANCEL_BTN).click()

      checkDoNotExist([rootTask])
    },
  )

  runBothModes(
    'cancel on parent form after a subtask was added — confirmation dialog appears, discard removes all',
    () => {
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(rootTask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()

      fillTaskForm(subtask)
      clickSubmitBtn()
      cy.get(TaskForm.SUBTASK_ROW).should('have.length', 1)

      cy.get(TaskForm.CANCEL_BTN).click()

      cy.contains('Are you sure you want to cancel?').should('be.visible')
      cy.contains('1 subtask').should('be.visible')
      cy.get('[data-testid="button-cancel-confirm-discard"]').click()

      checkDoNotExist([rootTask, subtask])
    },
  )

  runBothModes(
    'cancel on subtask form navigates back to parent, then cancel on parent discards all',
    () => {
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(rootTask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()

      cy.get(TaskForm.NAME_INPUT).type(subtask.name)
      cy.get(TaskForm.CANCEL_BTN).click()

      cy.get(TaskForm.NAME_INPUT).should('have.value', rootTask.name)

      cy.get(TaskForm.CANCEL_BTN).click()

      checkDoNotExist([rootTask, subtask])
    },
  )

  runBothModes(
    'cancel on parent form after multiple subtasks were added — confirmation shows correct count, discard removes all',
    () => {
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(rootTask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()

      fillTaskForm(subtask)
      clickSubmitBtn()
      cy.get(TaskForm.SUBTASK_ROW).should('have.length', 1)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      fillTaskForm(subtask2)
      clickSubmitBtn()
      cy.get(TaskForm.SUBTASK_ROW).should('have.length', 2)

      cy.get(TaskForm.CANCEL_BTN).click()

      cy.contains('Are you sure you want to cancel?').should('be.visible')
      cy.contains('2 subtasks').should('be.visible')
      cy.get('[data-testid="button-cancel-confirm-discard"]').click()

      checkDoNotExist([rootTask, subtask, subtask2])
    },
  )

  runBothModes(
    'cancel confirmation "Go Back" returns to parent form without discarding',
    () => {
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(rootTask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      fillTaskForm(subtask)
      clickSubmitBtn()
      cy.get(TaskForm.SUBTASK_ROW).should('have.length', 1)

      cy.get(TaskForm.CANCEL_BTN).click()

      cy.contains('Are you sure you want to cancel?').should('be.visible')
      cy.get('[data-testid="button-cancel-confirm-back"]').click()

      cy.get(TaskForm.NAME_INPUT).should('have.value', rootTask.name)
      cy.get(TaskForm.SUBTASK_ROW).should('have.length', 1)
    },
  )
})
