import type { FieldConfig, RankField } from '~/shared/schema'
import { ApiPaths, Selectors } from '../constants'
import { getSettings } from './api'
import { isLoggedIn } from './test-runner'

const { Settings } = Selectors

export const setFieldConfig = (targetConfig: FieldConfig) => {
  const loggedIn = isLoggedIn()
  cy.intercept('PUT', ApiPaths.UPDATE_SETTINGS).as('settingsPut')

  for (const field of Object.keys(targetConfig) as RankField[]) {
    const { visible, required } = targetConfig[field]

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

  loggedIn &&
    getSettings().then((settings) => {
      expect(settings.fieldConfig).to.eql(targetConfig)
    })
}
