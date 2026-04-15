import { Routes } from '@client/lib/constants'
import { DefaultTask, Selectors } from '@cypress/support/constants'
import { isLoggedIn, runBothModes } from '@cypress/support/utils'
import {
  type CreatedTask,
  checkNumCalls,
  interceptCreate,
  waitForCreate,
} from '@cypress/support/utils/intercepts'
import {
  checkTaskFormSubtasks,
  clickSubmitBtn,
  fillTaskForm,
} from '@cypress/support/utils/task-form'
import { checkTaskInTree } from '@cypress/support/utils/task-tree'

import { TaskStatus } from '~/shared/schema'

const { TaskForm } = Selectors

describe('Create Subtasks', () => {
  const rootTask = {
    ...DefaultTask,
    name: 'E2E Root Level Task',
    status: TaskStatus.PINNED,
  } as const satisfies CreatedTask

  const subtask = {
    ...DefaultTask,
    status: TaskStatus.OPEN,
    name: 'E2E Subtask 1',
  } as const satisfies CreatedTask

  const subtask2 = {
    ...subtask,
    name: 'E2E Subtask 2',
  } as const satisfies CreatedTask

  const subtask3 = {
    ...subtask,
    name: 'E2E Subtask 3',
  } as const satisfies CreatedTask

  beforeEach(() => {
    interceptCreate()

    const loggedIn = isLoggedIn()
    cy.visit(loggedIn ? Routes.HOME : Routes.GUEST)
  })

  runBothModes(
    'create a subtask while creating the parent task, check both appear in the tree',
    () => {
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(rootTask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      waitForCreate(rootTask)
      fillTaskForm(subtask)
      clickSubmitBtn()
      waitForCreate(subtask)
      cy.get(TaskForm.SUBTASK_ROW)
        .should('have.length', 1)
        .first()
        .should('contain.text', subtask.name)

      clickSubmitBtn('Save') // TODO: bugfix: should be "Create"
      // waitForUpdate() // TODO: debug test

      checkTaskInTree({ ...rootTask, subtasks: [subtask] })
      checkNumCalls({ create: 2 })
    },
  )

  runBothModes(
    'create multiple subtasks while creating the parent task, check both appear in the tree',
    () => {
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(rootTask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      waitForCreate(rootTask)

      fillTaskForm(subtask)
      clickSubmitBtn()
      waitForCreate(subtask)
      checkTaskFormSubtasks([subtask])

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      fillTaskForm(subtask2)
      clickSubmitBtn()
      waitForCreate(subtask2)
      checkTaskFormSubtasks([subtask, subtask2])

      clickSubmitBtn('Save') // TODO: bugfix: should be "Create"
      // waitForUpdate() // TODO: debug test

      checkTaskInTree({ ...rootTask, subtasks: [subtask, subtask2] })
      checkNumCalls({ create: 3 })
    },
  )

  runBothModes(
    'create nested subtasks while creating the parent task, check both appear in the tree',
    () => {
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(rootTask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      waitForCreate(rootTask)

      fillTaskForm(subtask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      waitForCreate(subtask)
      fillTaskForm(subtask2)
      clickSubmitBtn()
      waitForCreate(subtask2)
      checkTaskFormSubtasks([subtask2])

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      fillTaskForm(subtask3)
      clickSubmitBtn()
      waitForCreate(subtask3)
      checkTaskFormSubtasks([subtask2, subtask3])

      clickSubmitBtn('Save') // TODO: bugfix: should be "Create"
      // waitForCreate(subtask) // TODO: debug test
      checkTaskFormSubtasks([subtask, subtask2, subtask3])

      clickSubmitBtn('Save') // TODO: bugfix: should be "Create"
      // waitForUpdate() // TODO: debug test

      checkTaskInTree({
        ...rootTask,
        subtasks: [{ ...subtask, subtasks: [subtask2, subtask3] }],
      })
      checkNumCalls({ create: 4 })
    },
  )
})
