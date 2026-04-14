import { Routes } from '@client/lib/constants'
import {
  DefaultTask,
  FieldConfigAllFalse,
  Selectors,
} from '@cypress/support/constants'
import { isLoggedIn, runBothModes } from '@cypress/support/utils'
import { setSettings } from '@cypress/support/utils/settings'
import {
  fillTaskForm,
  maybeWaitForCreate,
  submitTaskForm,
  type TaskFormData,
} from '@cypress/support/utils/task-form'
import { checkTaskInTree } from '@cypress/support/utils/task-tree'

import type { FieldConfig } from '~/shared/schema'

const { TaskForm } = Selectors

describe('Task Creation', () => {
  beforeEach(() => {
    const loggedIn = isLoggedIn()
    cy.visit(loggedIn ? Routes.HOME : Routes.GUEST)
  })

  runBothModes('create a task, check displays in main tree', () => {
    cy.get(Selectors.CREATE_TASK_BTN).click()
    fillTaskForm(DefaultTask)
    submitTaskForm(DefaultTask)
    checkTaskInTree(DefaultTask)
  })

  runBothModes(
    'change rank field visibility/required in settings, check form matches the new settings, create task adhering to new settings',
    () => {
      const fieldConfig = {
        priority: { visible: true, required: true },
        ease: { visible: true, required: false },
        enjoyment: { visible: false, required: false },
        time: { visible: true, required: false },
        timeSpent: { visible: false, required: false },
      } as const satisfies FieldConfig

      const newTask = {
        ...DefaultTask,
        name: 'Field Config Test Task',
        ease: null,
        enjoyment: null,
      } satisfies TaskFormData

      setSettings({ fieldConfig })
      cy.get(Selectors.BACK_BTN).click()

      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(newTask, fieldConfig)
      submitTaskForm(newTask)
      checkTaskInTree(newTask)
    },
  )

  runBothModes(
    'change time spent field visibility/required in settings, check form matches the new settings, create task adhering to new settings',
    () => {
      const fieldConfig = {
        ...FieldConfigAllFalse,
        timeSpent: { visible: true, required: false },
      } as const satisfies FieldConfig

      setSettings({ fieldConfig })
      cy.get(Selectors.BACK_BTN).click()

      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(DefaultTask, fieldConfig)
      cy.get(TaskForm.MARK_COMPLETED_CHECKBOX).click()
      cy.get(TaskForm.SUBMIT_BTN).should('be.disabled')
      cy.get(TaskForm.TIME_SPENT_INPUT_HOURS).type('1')
      submitTaskForm(DefaultTask)
      // TODO: check is in completed tree
    },
  )

  runBothModes(
    'create a subtask while creating the parent task, check both appear in the tree',
    () => {
      const parentTask = {
        ...DefaultTask,
        name: 'E2E Parent Task',
      } as const satisfies TaskFormData

      const subtask = {
        ...DefaultTask,
        name: 'E2E Subtask',
      } as const satisfies TaskFormData

      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(parentTask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      maybeWaitForCreate(parentTask)

      fillTaskForm(subtask)
      submitTaskForm(subtask)
      // TODO: if cancels at parent level, should subtasks be deleted? Or left orphaned?

      cy.get(TaskForm.SUBTASK_ROW)
        .should('have.length', 1)
        .first()
        .should('contain.text', subtask.name)

      submitTaskForm(parentTask)

      checkTaskInTree({ ...parentTask, subtasks: [subtask] })
    },
  )

  runBothModes(
    'create multiple subtasks while creating the parent task, check both appear in the tree',
    () => {
      const parentTask = {
        ...DefaultTask,
        name: 'E2E Parent Task',
      } as const satisfies TaskFormData

      const subtask1 = {
        ...DefaultTask,
        name: 'E2E Subtask 1',
      } as const satisfies TaskFormData

      const subtask2 = {
        ...DefaultTask,
        name: 'E2E Subtask 2',
      } as const satisfies TaskFormData

      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(parentTask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      maybeWaitForCreate(parentTask)

      fillTaskForm(subtask1)
      submitTaskForm(subtask1)
      // TODO: if cancels at parent level, should subtasks be deleted? Or left orphaned?

      cy.get(TaskForm.SUBTASK_ROW)
        .should('have.length', 1)
        .getElementArrayText()
        .should('equal', [subtask1.name])

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      fillTaskForm(subtask2)
      submitTaskForm(subtask2)

      cy.get(TaskForm.SUBTASK_ROW)
        .should('have.length', 2)
        .getElementArrayText()
        .should('equal', [subtask1.name, subtask2.name])

      submitTaskForm(parentTask)

      checkTaskInTree({ ...parentTask, subtasks: [subtask1, subtask2] })
    },
  )

  runBothModes(
    'create nested subtasks while creating the parent task, check both appear in the tree',
    () => {
      const parentTask = {
        ...DefaultTask,
        name: 'E2E Parent Task',
      } as const satisfies TaskFormData

      const subtask1 = {
        ...DefaultTask,
        name: 'E2E Subtask 1',
      } as const satisfies TaskFormData

      const subtask2 = {
        ...DefaultTask,
        name: 'E2E Subtask 2',
      } as const satisfies TaskFormData

      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(parentTask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      maybeWaitForCreate(parentTask)

      fillTaskForm(subtask1)
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      maybeWaitForCreate(subtask1)

      fillTaskForm(subtask2)
      submitTaskForm(subtask2)

      cy.get(TaskForm.SUBTASK_ROW)
        .should('have.length', 1)
        .getElementArrayText()
        .should('equal', [subtask2.name])

      submitTaskForm(subtask1)

      cy.get(TaskForm.SUBTASK_ROW)
        .should('have.length', 2)
        .getElementArrayText()
        .should('equal', [subtask1.name, subtask2.name])

      submitTaskForm(parentTask)

      checkTaskInTree({
        ...parentTask,
        subtasks: [{ ...subtask1, subtasks: [subtask2] }],
      })
    },
  )
})
