import { Routes } from '@client/lib/constants'
import {
  ApiPaths,
  DefaultTask,
  FieldConfigAllFalse,
  FieldConfigAllTrue,
  Selectors,
} from '@cypress/support/constants'
import { runBothModes } from '@cypress/support/utils'
import { setFieldConfig } from '@cypress/support/utils/settings'
import {
  fillTaskForm,
  submitTaskForm,
  type TaskFormData,
} from '@cypress/support/utils/task-form'
import { checkTaskInTree } from '@cypress/support/utils/task-tree'

import type { FieldConfig } from '~/shared/schema'

const { Menu, TaskCard, TaskForm } = Selectors

describe('Task Creation', () => {
  runBothModes('create a task, check displays in main tree', (isLoggedIn) => {
    cy.visit(isLoggedIn ? Routes.HOME : Routes.GUEST)

    cy.get(Selectors.CREATE_TASK_BTN).click()
    fillTaskForm(DefaultTask, FieldConfigAllTrue)
    submitTaskForm(DefaultTask, 'Create')
    checkTaskInTree(DefaultTask)
  })

  runBothModes(
    'change rank field visibility/required in settings, check form matches the new settings, create task adhering to new settings',
    (isLoggedIn) => {
      const fieldConfig = {
        priority: { visible: true, required: true },
        ease: { visible: true, required: false },
        enjoyment: { visible: false, required: false },
        time: { visible: true, required: false },
        timeSpent: { visible: false, required: false },
      } as const satisfies FieldConfig

      const newTask = {
        ...DefaultTask,
        name: 'Field Config Test Task',
        ease: null,
        enjoyment: null,
      } satisfies TaskFormData

      cy.visit(isLoggedIn ? Routes.HOME : Routes.GUEST)

      cy.get(Selectors.MENU_BTN).click()
      cy.get(Menu.SETTINGS).click()
      setFieldConfig(fieldConfig)
      cy.get('@settingsPut').should('have.been.called', isLoggedIn ? 2 : 0)

      cy.get(Selectors.BACK_BTN).click()

      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(newTask, fieldConfig)
      submitTaskForm(newTask, 'Create')
      checkTaskInTree(newTask)
    },
  )

  runBothModes(
    'change time spent field visibility/required in settings, check form matches the new settings, create task adhering to new settings',
    (isLoggedIn) => {
      const fieldConfig = {
        ...FieldConfigAllFalse,
        timeSpent: { visible: true, required: false },
      } as const satisfies FieldConfig

      cy.visit(isLoggedIn ? Routes.HOME : Routes.GUEST)

      cy.get(Selectors.MENU_BTN).click()
      cy.get(Menu.SETTINGS).click()
      setFieldConfig(fieldConfig)
      cy.get('@settingsPut').should('have.been.called', isLoggedIn ? 2 : 0)

      cy.get(Selectors.BACK_BTN).click()

      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(DefaultTask, fieldConfig)
      cy.get(TaskForm.MARK_COMPLETED_CHECKBOX).click()
      cy.get(TaskForm.SUBMIT_BTN).should('be.disabled')
      cy.get(TaskForm.TIME_SPENT_INPUT_HOURS).type('1')
      submitTaskForm(DefaultTask, 'Create')
      // TODO: check is in completed tree
    },
  )

  runBothModes(
    'create a subtask while creating the parent task, check both appear in the tree',
    (isLoggedIn) => {
      const parentTask = {
        ...DefaultTask,
        name: 'E2E Parent Task',
      } as const satisfies TaskFormData

      const subtaskData = {
        ...DefaultTask,
        name: 'E2E Subtask',
      } as const satisfies TaskFormData

      cy.visit(isLoggedIn ? Routes.HOME : Routes.GUEST)

      // Open the new task form and fill in the parent task details
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(parentTask, FieldConfigAllTrue)

      // Clicking "Add Subtask" submits the parent form (creating the parent
      // task locally and queueing it for sync) then opens a fresh subtask form
      cy.intercept('POST', ApiPaths.CREATE_TASK).as('createParent')
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()

      // In logged-in mode wait for the parent to land on the server before
      // filling the subtask so backend assertions stay deterministic
      if (isLoggedIn) cy.wait('@createParent')

      // Fill and submit the subtask in the newly opened form
      fillTaskForm(subtaskData, FieldConfigAllTrue)
      submitTaskForm(subtaskData, 'Create')

      // After the subtask is saved the dialog returns to editing the parent —
      // close it to get back to the main task list
      cy.get(TaskForm.CANCEL_BTN).click()

      // Parent task must be visible in the main task list
      checkTaskInTree(parentTask)

      // Open the parent task edit dialog and confirm the subtask is listed
      cy.contains(TaskCard.CARD, parentTask.name)
        .find(TaskCard.TITLE)
        .click()
      cy.get(TaskForm.SUBTASK_ROW).should('contain.text', subtaskData.name)
    },
  )
})
