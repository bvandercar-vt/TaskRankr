import { Routes } from '@client/lib/constants'
import { ApiPaths, Selectors } from '@cypress/support/constants'
import { selectOption } from '@cypress/support/utils'

import type { UserSettings } from '~/shared/schema'
import { Priority, Time } from '~/shared/schema'

const { TaskForm, TaskCard, Menu, Settings: SettingsSelectors } = Selectors
const { RankSelect } = TaskForm
const { FieldConfig } = SettingsSelectors

const TASK_NAME = 'E2E Field Config Task'

/**
 * Navigate to Settings via the in-app dropdown (client-side routing).
 * This keeps the app state intact — important for guest mode where
 * isGuestMode lives only in React state and is lost on full page reload.
 */
const navigateToSettings = () => {
  cy.get(Selectors.MENU_BTN).click()
  cy.get(Menu.SETTINGS).click()
}

/**
 * Apply the field-config changes in the Settings page:
 *   - enjoyment → not visible  (also auto-disables required)
 *   - ease      → not required (stays visible)
 */
const applyFieldConfigChanges = () => {
  cy.get(FieldConfig.visibleCheckbox('enjoyment')).click()
  cy.get(FieldConfig.requiredCheckbox('ease')).click()
}

/**
 * From the Home page, open the task form, assert the correct fields are
 * present/absent, fill only the required fields, verify the Create button
 * becomes enabled, submit, and confirm the task appears in the list.
 */
const verifyTaskFormAndCreate = () => {
  cy.get(Selectors.CREATE_TASK_BTN).click()

  cy.get(RankSelect.ENJOYMENT).should('not.exist')
  cy.get(RankSelect.EASE).should('exist')

  cy.get(TaskForm.SUBMIT_BTN).should('be.disabled')

  cy.get(TaskForm.NAME_INPUT).type(TASK_NAME)
  cy.get(TaskForm.SUBMIT_BTN).should('be.disabled')

  selectOption(RankSelect.PRIORITY, Priority.HIGH)
  cy.get(TaskForm.SUBMIT_BTN).should('be.disabled')

  selectOption(RankSelect.TIME, Time.HIGH)

  cy.get(TaskForm.SUBMIT_BTN).should('be.enabled').should('have.text', 'Create')

  cy.get(TaskForm.SUBMIT_BTN).click()

  cy.get(TaskCard.CARD)
    .find(TaskCard.TITLE)
    .getElementArrayText()
    .should('include', TASK_NAME)
}

describe('Field Config Settings', () => {
  describe('Guest Mode', () => {
    beforeEach(() => {
      cy.clearLocalStorage()
      cy.visit(Routes.GUEST)
    })

    it('changes field visibility/required in settings, then creates a task respecting those settings', () => {
      navigateToSettings()

      cy.get(FieldConfig.visibleCheckbox('enjoyment')).should('have.attr', 'data-state', 'checked')
      cy.get(FieldConfig.requiredCheckbox('ease')).should('have.attr', 'data-state', 'checked')

      applyFieldConfigChanges()

      cy.get(FieldConfig.visibleCheckbox('enjoyment')).should('have.attr', 'data-state', 'unchecked')
      cy.get(FieldConfig.requiredCheckbox('ease')).should('have.attr', 'data-state', 'unchecked')

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

      cy.get(FieldConfig.visibleCheckbox('enjoyment')).should('have.attr', 'data-state', 'checked')
      cy.get(FieldConfig.requiredCheckbox('ease')).should('have.attr', 'data-state', 'checked')

      cy.intercept('PUT', ApiPaths.UPDATE_SETTINGS).as('settingsPut')

      applyFieldConfigChanges()

      cy.wait('@settingsPut')
      cy.wait('@settingsPut')

      cy.request<UserSettings>('GET', ApiPaths.GET_SETTINGS)
        .its('body')
        .then((settings) => {
          expect(settings.fieldConfig.enjoyment.visible, 'enjoyment visible').to.be.false
          expect(settings.fieldConfig.enjoyment.required, 'enjoyment required').to.be.false
          expect(settings.fieldConfig.ease.visible, 'ease visible').to.be.true
          expect(settings.fieldConfig.ease.required, 'ease required').to.be.false
        })

      cy.intercept('POST', ApiPaths.CREATE_TASK).as('createTask')

      cy.get(Selectors.BACK_BTN).click()

      verifyTaskFormAndCreate()

      cy.wait('@createTask')
    })
  })
})
