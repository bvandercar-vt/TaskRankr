import {
  DEFAULT_FIELD_CONFIG,
  type FieldConfig,
  RankField,
  type Task,
} from '~/shared/schema'
import { Selectors } from '../constants'
import { checkTaskExistsBackend } from './api'
import { isLoggedIn } from './test-runner'

const { TaskForm } = Selectors

export type TaskFormData = Pick<Task, 'name' | RankField>

export const fillTaskFormRankFields = (
  task: TaskFormData,
  settings: FieldConfig,
) => {
  const requiredFields = RankField.filter(
    (field) => settings[field].visible && settings[field].required,
  )

  cy.get(TaskForm.SUBMIT_BTN) //
    .should(requiredFields.length ? 'be.disabled' : 'not.be.disabled')

  const filled = new Set<RankField>()
  for (const field of RankField) {
    const RankSelect = TaskForm.rankSelect(field)
    const value = task[field]
    const config = settings[field]
    if (config.visible) {
      cy.get(RankSelect).should('be.visible')
      if (value !== null) {
        cy.selectOption(RankSelect, value)
        filled.add(field)
      }
      const allRequiredFilled = requiredFields.every((f) => filled.has(f))
      cy.get(TaskForm.SUBMIT_BTN) //
        .should(allRequiredFilled ? 'not.be.disabled' : 'be.disabled')
    } else {
      cy.get(RankSelect).should('not.exist')
    }
  }
}

/**
 * Fills form.
 */
export const fillTaskForm = (
  task: TaskFormData,
  settings: FieldConfig = DEFAULT_FIELD_CONFIG,
) => {
  const loggedIn = isLoggedIn()

  loggedIn && checkTaskExistsBackend(task, false)

  cy.get(TaskForm.SUBMIT_BTN).should('be.disabled')

  cy.get(TaskForm.NAME_INPUT).type(task.name)

  fillTaskFormRankFields(task, settings)

  if (settings.timeSpent.visible) {
    cy.get(TaskForm.TIME_SPENT_INPUT).should(
      settings.timeSpent.visible ? 'be.visible' : 'not.exist',
    )
    // TODO: test required
  }
}

export const clickSubmitBtn = (submitBtnText = 'Create') =>
  cy
    .get(TaskForm.SUBMIT_BTN)
    .should('have.text', submitBtnText)
    .should('not.be.disabled')
    .click()
