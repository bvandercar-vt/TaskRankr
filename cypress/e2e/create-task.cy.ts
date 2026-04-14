import { Routes } from '@client/lib/constants'
import {
  DefaultTask,
  FieldConfigAllTrue,
  Selectors,
} from '@cypress/support/constants'
import { runBothModes } from '@cypress/support/utils'
import { setFieldConfig } from '@cypress/support/utils/settings'
import {
  fillTaskForm,
  type TaskFormData,
} from '@cypress/support/utils/task-form'

import type { FieldConfig } from '~/shared/schema'

const { Menu } = Selectors

describe('Task Creation', () => {
  runBothModes('create a task, check displays in main tree', (isLoggedIn) => {
    cy.visit(isLoggedIn ? Routes.HOME : Routes.GUEST)

    cy.get(Selectors.CREATE_TASK_BTN).click()
    fillTaskForm(DefaultTask, FieldConfigAllTrue, 'Create')
  })

  runBothModes(
    'change field visibility/required in settings, check form matches the new settings, create task adhering to new settings',
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
      fillTaskForm(newTask, fieldConfig, 'Create')
    },
  )
})
