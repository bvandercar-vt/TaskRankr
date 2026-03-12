import type { FieldConfig, RankField } from '~/shared/schema'
import { Selectors } from '../constants'

const { Settings } = Selectors

export const setFieldConfig = (targetConfig: FieldConfig) => {
  for (const field of Object.keys(targetConfig) as RankField[]) {
    const { visible, required } = targetConfig[field]

    cy.get(Settings.FieldConfig.visibleCheckbox(field))
      .getCheckedState()
      .then(
        (isChecked) =>
          isChecked !== visible &&
          cy.get(Settings.FieldConfig.visibleCheckbox(field)).click(),
      )

    cy.get(Settings.FieldConfig.requiredCheckbox(field))
      .getCheckedState()
      .then(
        (isChecked) =>
          isChecked !== required &&
          cy.get(Settings.FieldConfig.requiredCheckbox(field)).click(),
      )
  }
}
