import { Routes } from '@client/lib/constants'
import { DefaultTask, Selectors } from '@cypress/support/constants'
import { runBothModes } from '@cypress/support/utils'
import { setFieldConfig } from '@cypress/support/utils/settings'
import {
  fillTaskForm,
  type TaskFormData,
} from '@cypress/support/utils/task-form'

import type { FieldConfig } from '~/shared/schema'

const { Menu } = Selectors

const RankFieldSettings = {
  priority: { visible: true, required: true },
  ease: { visible: true, required: false },
  enjoyment: { visible: false, required: false },
  time: { visible: true, required: false },
} as const satisfies FieldConfig

const newTask = {
  ...DefaultTask,
  name: 'Field Config Test Task',
  ease: null,
  enjoyment: null,
} satisfies TaskFormData

describe('Field Config Settings', () => {
  runBothModes(
    'changes field visibility/required in settings, then creates a task respecting those settings',
    (isLoggedIn) => {
      cy.visit(isLoggedIn ? Routes.HOME : Routes.GUEST)

      cy.get(Selectors.MENU_BTN).click()
      cy.get(Menu.SETTINGS).click()

      setFieldConfig(RankFieldSettings)

      cy.get(Selectors.BACK_BTN).click()

      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(newTask, RankFieldSettings, 'Create')

      cy.get('@settingsPut').should('have.been.called', isLoggedIn ? 2 : 0)
    },
  )
})
