import { Routes } from '@client/lib/constants'
import {
  DefaultTask,
  FieldConfigAllFalse,
  Selectors,
} from '@cypress/support/constants'
import { isLoggedIn, runBothModes } from '@cypress/support/utils'
import {
  type CreatedTask,
  checkNumCalls,
  interceptCreate,
  waitForCreate,
} from '@cypress/support/utils/intercepts'
import { setSettings } from '@cypress/support/utils/settings'
import {
  clickSubmitBtn,
  fillTaskForm,
  type TaskFormData,
} from '@cypress/support/utils/task-form'
import { checkTaskInTree } from '@cypress/support/utils/task-tree'

import { type FieldConfig, TaskStatus } from '~/shared/schema'

const { TaskForm } = Selectors

describe('Task Creation', () => {
  const rootTask = {
    ...DefaultTask,
    name: 'E2E Root Level Task',
    status: TaskStatus.PINNED,
  } as const satisfies CreatedTask

  const subtask = {
    ...DefaultTask,
    status: TaskStatus.OPEN,
    name: 'E2E Subtask 1',
  } as const satisfies CreatedTask

  const subtask2 = {
    ...subtask,
    name: 'E2E Subtask 2',
  } as const satisfies CreatedTask

  const subtask3 = {
    ...subtask,
    name: 'E2E Subtask 3',
  } as const satisfies CreatedTask

  beforeEach(() => {
    interceptCreate()

    const loggedIn = isLoggedIn()
    cy.visit(loggedIn ? Routes.HOME : Routes.GUEST)
  })

  runBothModes('create a task, check displays in main tree', () => {
    cy.get(Selectors.CREATE_TASK_BTN).click()
    fillTaskForm(rootTask)
    clickSubmitBtn()
    waitForCreate(rootTask)
    checkTaskInTree(rootTask)
    checkNumCalls({ create: 1 })
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
        ...rootTask,
        name: 'Field Config Test Task',
        ease: null,
        enjoyment: null,
      } satisfies TaskFormData

      setSettings({ fieldConfig })
      cy.get(Selectors.BACK_BTN).click()

      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(newTask, fieldConfig)
      clickSubmitBtn()
      waitForCreate(newTask)
      checkTaskInTree(newTask)
      checkNumCalls({ create: 1 })
    },
  )

  runBothModes(
    'change time spent field visibility/required in settings, check form matches the new settings, create task adhering to new settings',
    () => {
      const fieldConfig = {
        ...FieldConfigAllFalse,
        timeSpent: { visible: true, required: true },
      } as const satisfies FieldConfig

      setSettings({ fieldConfig })
      cy.get(Selectors.BACK_BTN).click()

      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(rootTask, fieldConfig)
      cy.get(TaskForm.MARK_COMPLETED_CHECKBOX).click()
      cy.get(TaskForm.SUBMIT_BTN).should('be.disabled')
      cy.get(TaskForm.TIME_SPENT_INPUT_HOURS).type('1')
      clickSubmitBtn()
      waitForCreate({ ...rootTask, status: TaskStatus.COMPLETED })
      // TODO: check is in completed tree
      checkNumCalls({ create: 1 })
    },
  )

  runBothModes(
    'create a subtask while creating the parent task, check both appear in the tree',
    () => {
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(rootTask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      waitForCreate(rootTask)
      fillTaskForm(subtask)
      clickSubmitBtn('Save') // TODO: bugfix: should be "Create"
      waitForCreate(subtask)
      cy.get(TaskForm.SUBTASK_ROW)
        .should('have.length', 1)
        .first()
        .should('contain.text', subtask.name)

      clickSubmitBtn('Save') // TODO: bugfix: should be "Create"
      waitForCreate(rootTask)

      checkTaskInTree({ ...rootTask, subtasks: [subtask] })
      checkNumCalls({ create: 2 })
    },
  )

  runBothModes(
    'create multiple subtasks while creating the parent task, check both appear in the tree',
    () => {
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(rootTask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      waitForCreate(rootTask)

      fillTaskForm(subtask)
      clickSubmitBtn('Save') // TODO: bugfix: should be "Create"
      waitForCreate(subtask)
      cy.get(TaskForm.SUBTASK_ROW)
        .getElementArrayText()
        .should('deep.equal', [subtask.name])

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      fillTaskForm(subtask2)
      clickSubmitBtn('Save') // TODO: bugfix: should be "Create"
      waitForCreate(subtask2)
      cy.get(TaskForm.SUBTASK_ROW)
        .getElementArrayText()
        .should('deep.equal', [subtask.name, subtask2.name])

      clickSubmitBtn('Save') // TODO: bugfix: should be "Create"
      waitForCreate(rootTask)

      checkTaskInTree({ ...rootTask, subtasks: [subtask, subtask2] })
      checkNumCalls({ create: 3 })
    },
  )

  runBothModes(
    'create nested subtasks while creating the parent task, check both appear in the tree',
    () => {
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(rootTask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      waitForCreate(rootTask)

      fillTaskForm(subtask)

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      waitForCreate(subtask)
      fillTaskForm(subtask2)
      clickSubmitBtn('Save') // TODO: bugfix: should be "Create"
      waitForCreate(subtask2)
      cy.get(TaskForm.SUBTASK_ROW)
        .getElementArrayText()
        .should('deep.equal', [subtask2.name])

      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      fillTaskForm(subtask3)
      clickSubmitBtn('Save') // TODO: bugfix: should be "Create"
      waitForCreate(subtask3)
      cy.get(TaskForm.SUBTASK_ROW)
        .getElementArrayText()
        .should('deep.equal', [subtask2.name, subtask3.name])

      clickSubmitBtn('Save') // TODO: bugfix: should be "Create"
      waitForCreate(subtask)

      cy.get(TaskForm.SUBTASK_ROW)
        .getElementArrayText()
        .should('deep.equal', [subtask.name, subtask2.name, subtask3.name])

      clickSubmitBtn('Save') // TODO: bugfix: should be "Create"
      waitForCreate(rootTask)

      checkTaskInTree({
        ...rootTask,
        subtasks: [{ ...subtask, subtasks: [subtask2, subtask3] }],
      })
      checkNumCalls({ create: 4 })
    },
  )
})
