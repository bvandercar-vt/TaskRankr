import { Routes } from '@client/lib/constants'
import { ApiPaths, DefaultTask, Selectors } from '@cypress/support/constants'
import { checkTaskExistsBackend, getSettings } from '@cypress/support/utils'
import { setFieldConfig } from '@cypress/support/utils/settings'
import {
  fillTaskForm,
  type TaskFormData,
} from '@cypress/support/utils/task-form'
import { checkTaskInTree } from '@cypress/support/utils/task-tree'

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

const navigateToSettings = () => {
  cy.get(Selectors.MENU_BTN).click()
  cy.get(Menu.SETTINGS).click()
}

const verifyTaskFormAndCreate = () => {
  cy.get(Selectors.CREATE_TASK_BTN).click()

  fillTaskForm(newTask, RankFieldSettings, 'Create')

  checkTaskInTree(newTask)
}

describe('Field Config Settings', () => {
  describe('Guest Mode', () => {
    beforeEach(() => {
      cy.visit(Routes.GUEST)
    })

    it('changes field visibility/required in settings, then creates a task respecting those settings', () => {
      navigateToSettings()

      setFieldConfig(RankFieldSettings)

      cy.get(Selectors.BACK_BTN).click()

      verifyTaskFormAndCreate()
    })
  })

  describe('Logged In Mode', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
      cy.clearTestUserTasks()
      cy.resetTestUserSettings()
      cy.visit(Routes.HOME)
    })

    it('changes field visibility/required in settings, verifies the backend, then creates a task respecting those settings', () => {
      navigateToSettings()

      cy.intercept('PUT', ApiPaths.UPDATE_SETTINGS).as('settingsPut')

      setFieldConfig(RankFieldSettings)

      cy.wait('@settingsPut')
      cy.wait('@settingsPut')

      getSettings().then((settings) => {
        expect(settings.fieldConfig).to.eql(RankFieldSettings)
      })

      checkTaskExistsBackend(newTask, false)

      cy.intercept('POST', ApiPaths.CREATE_TASK).as('createTask')

      cy.get(Selectors.BACK_BTN).click()

      verifyTaskFormAndCreate()

      cy.wait('@createTask')
      checkTaskExistsBackend(newTask, true)
    })
  })
})
