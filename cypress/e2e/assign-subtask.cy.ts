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
  clickSubmitBtn,
  fillTaskForm,
  type TaskFormData,
} from '@cypress/support/utils/task-form'
import { checkTaskInTree } from '@cypress/support/utils/task-tree'

const { TaskForm, TaskCard, AssignSubtaskDialog } = Selectors

describe('Assign Subtask', () => {
  const parentTask = {
    ...DefaultTask,
    name: 'E2E Assign Parent Task',
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
  })

  runBothModes(
    'assign an existing orphaned task as a subtask of a task',
    (loggedIn) => {
      // Create the orphan task
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(orphanTask)
      clickSubmitBtn()
      waitForCreate(orphanTask)

      // Create the parent task
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(parentTask)
      clickSubmitBtn()
      waitForCreate(parentTask)

      // Open the edit dialog for the parent task
      cy.contains(TaskCard.CARD, parentTask.name).click()

      // Click the assign button to open the assign subtask dialog
      cy.get(TaskForm.ASSIGN_SUBTASK_BTN).click()

      // The assign dialog should be visible with the orphan task listed
      cy.get(AssignSubtaskDialog.TITLE).should('be.visible')
      cy.contains(AssignSubtaskDialog.TASK_OPTION, orphanTask.name).click()

      // Confirm the assignment
      cy.get(AssignSubtaskDialog.CONFIRM_BTN).click()
      waitForUpdate()

      // Back in the parent edit form — orphan should now appear as a subtask row
      cy.get(TaskForm.SUBTASK_ROW)
        .should('have.length', 1)
        .first()
        .should('contain.text', orphanTask.name)

      // Close the edit dialog
      cy.get(TaskForm.CANCEL_BTN).click()

      // Verify the orphan task appears as a subtask under the parent in the tree
      checkTaskInTree({ ...parentTask, subtasks: [orphanTask] })

      cy.get('@createTask').should('have.been.called', loggedIn ? 2 : 0)
      cy.get('@updateTask').should('have.been.called', loggedIn ? 1 : 0)
    },
  )

  runBothModes(
    'mix of assigning an existing orphaned subtask and creating a new subtask',
    (loggedIn) => {
      // Create the orphan task
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(orphanTask)
      clickSubmitBtn()
      waitForCreate(orphanTask)

      // Create the parent task
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(parentTask)
      clickSubmitBtn()
      waitForCreate(parentTask)

      // Open the edit dialog for the parent task
      cy.contains(TaskCard.CARD, parentTask.name).click()

      // Assign the existing orphan as a subtask
      cy.get(TaskForm.ASSIGN_SUBTASK_BTN).click()
      cy.get(AssignSubtaskDialog.TITLE).should('be.visible')
      cy.contains(AssignSubtaskDialog.TASK_OPTION, orphanTask.name).click()
      cy.get(AssignSubtaskDialog.CONFIRM_BTN).click()
      waitForUpdate()

      // Orphan is now listed in the subtask rows
      cy.get(TaskForm.SUBTASK_ROW)
        .should('have.length', 1)
        .first()
        .should('contain.text', orphanTask.name)

      // Now add a brand-new subtask via the add button
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      fillTaskForm(newSubtask)
      clickSubmitBtn()
      waitForCreate(newSubtask)

      // Back in the parent edit form — both subtasks should be listed
      cy.get(TaskForm.SUBTASK_ROW)
        .should('have.length', 2)
        .getElementArrayText()
        .should('include', orphanTask.name)
        .and('include', newSubtask.name)

      // Close the edit dialog
      cy.get(TaskForm.CANCEL_BTN).click()

      // Verify both subtasks appear under the parent in the tree
      checkTaskInTree({ ...parentTask, subtasks: [orphanTask, newSubtask] })

      cy.get('@createTask').should('have.been.called', loggedIn ? 3 : 0)
      cy.get('@updateTask').should('have.been.called', loggedIn ? 1 : 0)
    },
  )
})
