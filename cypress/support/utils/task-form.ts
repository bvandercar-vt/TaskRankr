import { RANK_FIELDS_COLUMNS } from '@client/lib/task-utils'

import type { FieldConfig, RankField, Task } from '~/shared/schema'
import { ApiPaths, Selectors } from '../constants'
import { checkTaskExistsBackend } from './api'
import { checkTaskInTree } from './task-tree'
import { isLoggedIn } from './test-runner'

const { TaskForm } = Selectors

export type TaskFormData = Pick<Task, 'name' | RankField>

const rankFields = RANK_FIELDS_COLUMNS.map((col) => col.name)

export const fillTaskForm = (
  task: TaskFormData,
  settings: FieldConfig,
  submitBtnText: string,
) => {
  const loggedIn = isLoggedIn()

  loggedIn && checkTaskExistsBackend(task, false)
  cy.intercept('POST', ApiPaths.CREATE_TASK).as('createTask')

  cy.get(TaskForm.SUBMIT_BTN).should('be.disabled')

  cy.get(TaskForm.NAME_INPUT).type(task.name)

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

  cy.get(TaskForm.SUBMIT_BTN)
    .should('have.text', submitBtnText)
    .should('not.be.disabled')
    .click()

  loggedIn && cy.wait('@createTask')

  checkTaskInTree(task)

  checkTaskExistsBackend(task, loggedIn)

  cy.get('@createTask').should('have.been.called', loggedIn ? 1 : 0)
}
