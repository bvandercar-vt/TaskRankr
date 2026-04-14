import type { Entries } from 'type-fest'

import type { FieldConfig, UserSettings } from '~/shared/schema'
import { ApiPaths, Selectors } from '../constants'
import { getSettings } from './api'
import { isLoggedIn } from './test-runner'

const { Menu, Settings } = Selectors

export const setSettings = (settings: Pick<UserSettings, 'fieldConfig'>) => {
  const loggedIn = isLoggedIn()

  cy.get(Selectors.MENU_BTN).click()
  cy.get(Menu.SETTINGS).click()

  cy.intercept('PUT', ApiPaths.UPDATE_SETTINGS).as('settingsPut')

  setFieldConfig(settings.fieldConfig)
  cy.get('@settingsPut').should('have.been.called', loggedIn ? 2 : 0)

  loggedIn &&
    getSettings().then((currentSettings) => {
      expect(currentSettings).to.deep.include(settings)
    })
}

const setFieldConfig = (targetConfig: FieldConfig) => {
  for (const [field, { visible, required }] of Object.entries(
    targetConfig,
  ) as Entries<FieldConfig>) {
    cy.get(Settings.FieldConfig.visibleCheckbox(field))
      .getCheckedState()
      .then((isChecked) => {
        if (isChecked !== visible) {
          cy.get(Settings.FieldConfig.visibleCheckbox(field)).click()
          cy.wait('@settingsPut')
        }
      })

    cy.get(Settings.FieldConfig.requiredCheckbox(field))
      .getCheckedState()
      .then((isChecked) => {
        if (isChecked !== required) {
          cy.get(Settings.FieldConfig.requiredCheckbox(field)).click()
          cy.wait('@settingsPut')
        }
      })
  }
}
