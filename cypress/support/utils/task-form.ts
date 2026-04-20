import {
  DEFAULT_FIELD_CONFIG,
  type FieldConfig,
  RankField,
  type Task,
} from '~/shared/schema'
import { Selectors } from '../constants'
import { checkTasksExistBackend } from './api'
import { type CreatedTask, waitForCreate, waitForUpdate } from './intercepts'

const { TaskForm, AssignSubtaskDialog } = Selectors

type TaskFormData = Pick<Task, 'name' | RankField>

export const getTaskForm = (tier = 0) => {
  cy.wait(50) // Re-renders. TODO: debug and fix src so this doesn't happen.
  return cy.get(`${TaskForm.FORM}[data-tier="${tier}"]`).should('be.visible')
}

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
  cy.log(`**filling task form... (task: ${task.name})**`)
  checkTasksExistBackend([task], false)

  cy.get(TaskForm.SUBMIT_BTN).should('be.disabled')

  cy.get(TaskForm.ADD_SUBTASK_BTN).should('be.disabled')
  cy.get(TaskForm.NAME_INPUT).type(task.name)
  cy.get(TaskForm.ADD_SUBTASK_BTN).should('be.enabled')

  fillTaskFormRankFields(task, settings)

  if (settings.timeSpent.visible) {
    cy.get(TaskForm.TIME_SPENT_INPUT).should(
      settings.timeSpent.visible ? 'be.visible' : 'not.exist',
    )
    // TODO: test required
  }
  cy.log(`**...task form filled (task: ${task.name})**`)
}

const clickSubmitBtn = (submitBtnText: string, afterSubmit?: () => void) =>
  cy
    .get(TaskForm.SUBMIT_BTN)
    .should('have.text', submitBtnText)
    .should('not.be.disabled')
    .click()
    .then(($btn) => {
      afterSubmit?.()
      cy.wrap($btn).should('not.exist')
    })

export const clickSubmitBtnCreate = (
  task: CreatedTask,
  noCreateCheck?: boolean,
) => {
  checkTasksExistBackend([task], false)
  clickSubmitBtn(
    'Create',
    noCreateCheck ? undefined : () => waitForCreate(task),
  )
}

export const clickSubmitBtnUpdate = () => clickSubmitBtn('Save')

export const assignSubtask = (
  /**
   * the orphan task to assign as subtask.
   */
  task: CreatedTask,
) => {
  cy.get(TaskForm.ASSIGN_SUBTASK_BTN).click()
  cy.escapeWithin()
    .find(AssignSubtaskDialog.DIALOG)
    .should('be.visible')
    .within(() => {
      cy.contains(AssignSubtaskDialog.TASK_OPTION, task.name).click()
      cy.get(AssignSubtaskDialog.CONFIRM_BTN).click()
    })
  waitForUpdate(task)
}

export const checkTaskFormSubtasks = (subtasks: Pick<Task, 'name'>[]) =>
  // TODO: test how they are nested
  cy
    .get(TaskForm.SUBTASK_ROW)
    .should('have.length', subtasks.length)
    .getElementArrayText()
    .should(
      'deep.equal',
      subtasks.map((subtask) => subtask.name),
    )
