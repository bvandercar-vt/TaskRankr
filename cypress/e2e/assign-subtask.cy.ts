import { Routes } from '@client/lib/constants'
import { DefaultTask, Selectors } from '@cypress/support/constants'
import { isLoggedIn, runBothModes } from '@cypress/support/utils'
import {
  interceptCreate,
  interceptUpdate,
  waitForCreate,
  waitForUpdate,
} from '@cypress/support/utils/intercepts'
import {
  assignSubtask,
  checkTaskFormSubtasks,
  clickSubmitBtn,
  fillTaskForm,
  type TaskFormData,
} from '@cypress/support/utils/task-form'
import { checkTaskInTree } from '@cypress/support/utils/task-tree'

const { TaskForm, TaskCard } = Selectors

describe('Assign Subtask', () => {
  const rootTask = {
    ...DefaultTask,
    name: 'E2E Root Task',
  } as const satisfies TaskFormData

  const orphanTask = {
    ...DefaultTask,
    name: 'E2E Orphan Task',
  } as const satisfies TaskFormData

  const newSubtask = {
    ...DefaultTask,
    name: 'E2E Brand New Subtask',
  } as const satisfies TaskFormData

  beforeEach(() => {
    interceptCreate()
    interceptUpdate()

    const loggedIn = isLoggedIn()
    cy.visit(loggedIn ? Routes.HOME : Routes.GUEST)

    // Create the orphan task
    cy.get(Selectors.CREATE_TASK_BTN).click()
    fillTaskForm(orphanTask)
    clickSubmitBtn()
    waitForCreate(orphanTask)
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
      `assign an existing orphaned task as a subtask of a task - ${logStr}`,
      (loggedIn) => {
        beforeTest()

        assignSubtask(orphanTask)
        waitForUpdate()
        checkTaskFormSubtasks([orphanTask])

        cy.get(TaskForm.SUBMIT_BTN).click() // TODO: try cancel and ensure wasn't assigned.
        checkTaskInTree({ ...rootTask, subtasks: [orphanTask] })

        cy.get('@createTask').should('have.been.called', loggedIn ? 2 : 0)
        cy.get('@updateTask').should('have.been.called', loggedIn ? 1 : 0)
      },
    )

    runBothModes(
      `mix of assigning an existing orphaned subtask and creating a new subtask - ${logStr}`,
      (loggedIn) => {
        beforeTest()

        assignSubtask(orphanTask)
        waitForUpdate()
        checkTaskFormSubtasks([orphanTask])

        // Now add a brand-new subtask via the add button
        cy.get(TaskForm.ADD_SUBTASK_BTN).click()
        fillTaskForm(newSubtask)
        clickSubmitBtn()
        waitForCreate(newSubtask)
        checkTaskFormSubtasks([orphanTask, newSubtask])

        cy.get(TaskForm.SUBMIT_BTN).click() // TODO: try cancel and ensure wasn't assigned.
        checkTaskInTree({ ...rootTask, subtasks: [orphanTask, newSubtask] })

        cy.get('@createTask').should('have.been.called', loggedIn ? 3 : 0)
        cy.get('@updateTask').should('have.been.called', loggedIn ? 1 : 0)
      },
    )
  }
})
