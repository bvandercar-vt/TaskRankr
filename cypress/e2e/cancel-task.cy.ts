import { Routes } from '@client/lib/constants'
import { DefaultTask, Selectors } from '@cypress/support/constants'
import { checkTaskExistsBackend } from '@cypress/support/utils/api'
import {
  interceptDelete,
  waitForCreate,
  waitForDelete,
} from '@cypress/support/utils/intercepts'
import {
  fillTaskForm,
  submitTaskForm,
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
    'cancel on parent form after a subtask was created — parent and subtask are deleted',
    () => {
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(rootTask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      waitForCreate(rootTask)

      fillTaskForm(subtask)
      submitTaskForm(subtask)
      cy.get(TaskForm.SUBTASK_ROW).should('have.length', 1)

      interceptDelete()
      cy.get(TaskForm.CANCEL_BTN).click()
      waitForDelete(rootTask)

      checkDoNotExist([rootTask, subtask])
    },
  )

  runBothModes(
    'cancel on subtask form navigates back to parent, then cancel on parent deletes it',
    () => {
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(rootTask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      waitForCreate(rootTask)

      cy.get(TaskForm.NAME_INPUT).type(subtask.name)
      cy.get(TaskForm.CANCEL_BTN).click()

      cy.get(TaskForm.NAME_INPUT).should('have.value', rootTask.name)

      interceptDelete()
      cy.get(TaskForm.CANCEL_BTN).click()
      waitForDelete(rootTask)

      checkDoNotExist([rootTask, subtask])
    },
  )

  runBothModes(
    'cancel on parent form after multiple subtasks were created — all are deleted',
    () => {
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(rootTask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      waitForCreate(rootTask)

      fillTaskForm(subtask)
      submitTaskForm(subtask)
      cy.get(TaskForm.SUBTASK_ROW).should('have.length', 1)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      fillTaskForm(subtask2)
      submitTaskForm(subtask2)
      cy.get(TaskForm.SUBTASK_ROW).should('have.length', 2)

      interceptDelete()
      cy.get(TaskForm.CANCEL_BTN).click()
      waitForDelete(rootTask)

      checkDoNotExist([rootTask, subtask, subtask2])
    },
  )
})
