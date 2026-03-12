import {
  type FieldConfig,
  type RankField,
  SortOption,
  type Task,
} from '~/shared/schema'
import { Selectors } from '../constants'

const { TaskForm } = Selectors

export const fillTaskForm = (
  { name, ...rankfields }: Pick<Task, 'name' | RankField>,
  settings: FieldConfig,
  submitBtnText: string,
) => {
  cy.get(TaskForm.SUBMIT_BTN).should('be.disabled')

  cy.get(TaskForm.NAME_INPUT).type(name)

  const rankFields = [
    SortOption.PRIORITY,
    SortOption.EASE,
    SortOption.ENJOYMENT,
    SortOption.TIME,
  ] as const

  const lastRequired = [...rankFields]
    .reverse()
    .find((field) => settings[field].visible && settings[field].required)

  cy.get(TaskForm.SUBMIT_BTN) //
    .should(lastRequired ? 'be.disabled' : 'not.be.disabled')

  let allRequiredSelected = !lastRequired
  for (const field of rankFields) {
    const RankSelect = TaskForm.rankSelect(field)
    const value = rankfields[field]
    const config = settings[field]
    if (config.visible) {
      cy.get(RankSelect).should('be.visible')
      if (value !== null) {
        cy.selectOption(RankSelect, value)
        if (field === lastRequired) {
          allRequiredSelected = true
        }
      }
      cy.get(TaskForm.SUBMIT_BTN) //
        .should(allRequiredSelected ? 'not.be.disabled' : 'be.disabled')
    } else {
      cy.get(RankSelect).should('not.exist')
    }
  }

  cy.get(TaskForm.SUBMIT_BTN)
    .should('have.text', submitBtnText)
    .should('not.be.disabled')
    .click()
}
