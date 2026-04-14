import { Routes } from '@client/lib/constants'
import { DefaultTask, Selectors } from '@cypress/support/constants'
import { isLoggedIn, runBothModes } from '@cypress/support/utils'
import {
  interceptCreate,
  interceptUpdate,
  waitForCreate,
} from '@cypress/support/utils/intercepts'
import {
  checkTaskFormSubtasks,
  clickSubmitBtn,
  fillTaskForm,
  type TaskFormData,
} from '@cypress/support/utils/task-form'
import { checkTaskInTree } from '@cypress/support/utils/task-tree'

const { TaskForm, TaskCard } = Selectors

describe('Create Subtask', () => {
  const rootTask = {
    ...DefaultTask,
    name: 'E2E Root Level Task',
  } as const satisfies TaskFormData

  const subtask = {
    ...DefaultTask,
    name: 'E2E Subtask 1',
  } as const satisfies TaskFormData

  const subtask2 = {
    ...DefaultTask,
    name: 'E2E Subtask 2',
  } as const satisfies TaskFormData

  const subtask3 = {
    ...DefaultTask,
    name: 'E2E Subtask 3',
  } as const satisfies TaskFormData

  beforeEach(() => {
    interceptCreate()
    interceptUpdate()

    const loggedIn = isLoggedIn()
    cy.visit(loggedIn ? Routes.HOME : Routes.GUEST)
  })

  for (const [logStr, beforeTest] of [
    [
      'while creating new task',
      () => {
        // Fill form for the parent task, but don't submit yet
        cy.get(Selectors.CREATE_TASK_BTN).click()
        fillTaskForm(rootTask)
      },
    ],
    [
      'while editing existing task',
      () => {
        // Create the parent task
        cy.get(Selectors.CREATE_TASK_BTN).click()
        fillTaskForm(rootTask)
        clickSubmitBtn()
        waitForCreate(rootTask)

        // Open the edit dialog for the parent task,
        cy.contains(TaskCard.CARD, rootTask.name).click()
      },
    ],
  ] as const) {
    runBothModes(
      `create a subtask, check appears in tree - ${logStr}`,
      (loggedIn) => {
        beforeTest()

        cy.get(TaskForm.ADD_SUBTASK_BTN).click()
        waitForCreate(rootTask)
        fillTaskForm(subtask)
        clickSubmitBtn()
        waitForCreate(subtask)
        checkTaskFormSubtasks([subtask])

        clickSubmitBtn()
        waitForCreate(rootTask)

        checkTaskInTree({ ...rootTask, subtasks: [subtask] })
        cy.get('@createTask').should('have.been.called', loggedIn ? 2 : 0)
      },
    )

    runBothModes(
      `create multiple subtasks, check appear in tree - ${logStr}`,
      (loggedIn) => {
        beforeTest()

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

        clickSubmitBtn()
        waitForCreate(rootTask)

        checkTaskInTree({ ...rootTask, subtasks: [subtask, subtask2] })
        cy.get('@createTask').should('have.been.called', loggedIn ? 3 : 0)
      },
    )

    runBothModes(
      `create nested subtasks, ensure appear in tree - ${logStr}`,
      (loggedIn) => {
        beforeTest()

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

        clickSubmitBtn()
        waitForCreate(subtask)
        checkTaskFormSubtasks([subtask, subtask2, subtask3])

        clickSubmitBtn()
        waitForCreate(rootTask)

        checkTaskInTree({
          ...rootTask,
          subtasks: [{ ...subtask, subtasks: [subtask2, subtask3] }],
        })
        cy.get('@createTask').should('have.been.called', loggedIn ? 4 : 0)
      },
    )
  }
})
