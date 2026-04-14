import { RANK_FIELDS_COLUMNS } from '@client/lib/task-utils'

import {
  DEFAULT_FIELD_CONFIG,
  type FieldConfig,
  type RankField,
  type Task,
  TaskStatus,
} from '~/shared/schema'
import { Selectors } from '../constants'
import { checkTaskExistsBackend } from './api'
import { interceptCreate, waitForCreate } from './intercepts'
import { isLoggedIn } from './test-runner'

const { TaskForm } = Selectors

export type TaskFormData = Pick<Task, 'name' | RankField>

const rankFields = RANK_FIELDS_COLUMNS.map((col) => col.name)

export const fillTaskFormRankFields = (
  task: TaskFormData,
  settings: FieldConfig,
) => {
  const requiredFields = rankFields.filter(
    (field) => settings[field].visible && settings[field].required,
  )

  cy.get(TaskForm.SUBMIT_BTN) //
    .should(requiredFields.length ? 'be.disabled' : 'not.be.disabled')

  const filled = new Set<RankField>()
  for (const field of rankFields) {
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
  interceptCreate()

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

export const clickSubmitBtn = (submitBtnText = 'Create') => {
  cy.get(TaskForm.SUBMIT_BTN)
    .should('have.text', submitBtnText)
    .should('not.be.disabled')
    .click()
}

/**
 * Submits form and checks results in the UI and (if logged in) backend.
 */
export const submitTaskForm = (
  { status = TaskStatus.OPEN, ...task }: TaskFormData & { status?: TaskStatus },
  submitBtnText = 'Create',
) => {
  cy.get(TaskForm.SUBMIT_BTN)
    .should('have.text', submitBtnText)
    .should('not.be.disabled')
    .click()

  waitForCreate({ ...task, status })
}
