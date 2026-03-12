import { Routes } from '@client/lib/constants'
import {
  DefaultTask,
  Selectors,
  SettingsAllVisbileAllRequired,
} from '@cypress/support/constants'
import { runBothModes } from '@cypress/support/utils'
import { fillTaskForm } from '@cypress/support/utils/task-form'

describe('Create Task', () => {
  runBothModes(
    'creates a task and displays it in the main tree',
    (isLoggedIn) => {
      cy.visit(isLoggedIn ? Routes.HOME : Routes.GUEST)

      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(DefaultTask, SettingsAllVisbileAllRequired, 'Create')
    },
  )
})
