import { Routes } from '@client/lib/constants'
import {
  DefaultTask,
  FieldConfigAllFalse,
  Selectors,
} from '@cypress/support/constants'
import { isLoggedIn, runBothModes } from '@cypress/support/utils'
import { setFieldConfig } from '@cypress/support/utils/settings'
import {
  checkTaskMaybeCreatedBackend,
  fillTaskForm,
  submitTaskForm,
  type TaskFormData,
} from '@cypress/support/utils/task-form'
import { checkTaskInTree } from '@cypress/support/utils/task-tree'

import { DEFAULT_FIELD_CONFIG, type FieldConfig } from '~/shared/schema'

const { Menu, TaskForm } = Selectors

describe('Task Creation', () => {
  beforeEach(() => {
    const loggedIn = isLoggedIn()
    cy.visit(loggedIn ? Routes.HOME : Routes.GUEST)
  })

  runBothModes('create a task, check displays in main tree', () => {
    cy.get(Selectors.CREATE_TASK_BTN).click()
    fillTaskForm(DefaultTask, DEFAULT_FIELD_CONFIG)
    submitTaskForm(DefaultTask, 'Create')
    checkTaskInTree(DefaultTask)
  })

  runBothModes(
    'change rank field visibility/required in settings, check form matches the new settings, create task adhering to new settings',
    (loggedIn) => {
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

      cy.get(Selectors.MENU_BTN).click()
      cy.get(Menu.SETTINGS).click()
      setFieldConfig(fieldConfig)
      cy.get('@settingsPut').should('have.been.called', loggedIn ? 2 : 0)

      cy.get(Selectors.BACK_BTN).click()

      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(newTask, fieldConfig)
      submitTaskForm(newTask, 'Create')
      checkTaskInTree(newTask)
    },
  )

  runBothModes(
    'change time spent field visibility/required in settings, check form matches the new settings, create task adhering to new settings',
    (loggedIn) => {
      const fieldConfig = {
        ...FieldConfigAllFalse,
        timeSpent: { visible: true, required: false },
      } as const satisfies FieldConfig

      cy.get(Selectors.MENU_BTN).click()
      cy.get(Menu.SETTINGS).click()
      setFieldConfig(fieldConfig)
      cy.get('@settingsPut').should('have.been.called', loggedIn ? 2 : 0)

      cy.get(Selectors.BACK_BTN).click()

      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(DefaultTask, fieldConfig)
      cy.get(TaskForm.MARK_COMPLETED_CHECKBOX).click()
      cy.get(TaskForm.SUBMIT_BTN).should('be.disabled')
      cy.get(TaskForm.TIME_SPENT_INPUT_HOURS).type('1')
      submitTaskForm(DefaultTask, 'Create')
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
      fillTaskForm(parentTask, DEFAULT_FIELD_CONFIG)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      checkTaskMaybeCreatedBackend(parentTask)

      fillTaskForm(subtask, DEFAULT_FIELD_CONFIG)
      submitTaskForm(subtask, 'Create')

      cy.get(TaskForm.SUBTASK_ROW)
        .should('have.length', 1)
        .first()
        .should('contain.text', subtask.name)

      submitTaskForm(parentTask, 'Create')

      checkTaskInTree(parentTask)
    },
  )
})
