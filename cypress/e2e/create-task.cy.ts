import { Routes } from '@client/lib/constants'
import {
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

const { Menu, TaskForm } = Selectors

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
})
