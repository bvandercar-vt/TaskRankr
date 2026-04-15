import { Routes } from '@client/lib/constants'
import { DefaultTask, Selectors } from '@cypress/support/constants'
import { isLoggedIn, runBothModes } from '@cypress/support/utils'
import {
  type CreatedTask,
  checkNumCalls,
  interceptCreate,
  interceptUpdate,
  waitForCreate,
} from '@cypress/support/utils/intercepts'
import {
  checkTaskFormSubtasks,
  clickSubmitBtn,
  fillTaskForm,
} from '@cypress/support/utils/task-form'
import { checkTaskInTree } from '@cypress/support/utils/task-tree'

import { TaskStatus } from '~/shared/schema'

const { TaskForm } = Selectors

describe('Create Subtasks', () => {
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
    interceptUpdate()

    const loggedIn = isLoggedIn()
    cy.visit(loggedIn ? Routes.HOME : Routes.GUEST)

    cy.get(Selectors.CREATE_TASK_BTN).click()
    fillTaskForm(rootTask)
  })

  runBothModes('create a subtask, check appears in tree', () => {
    const subtasks: CreatedTask[] = []
    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    waitForCreate(rootTask)
    fillTaskForm(subtask)
    clickSubmitBtn()
    waitForCreate(subtask)
    subtasks.push(subtask)
    checkTaskFormSubtasks(subtasks)

    clickSubmitBtn('Save') // TODO: bugfix: should be "Create"
    // waitForUpdate() // TODO: debug test

    checkTaskInTree({ ...rootTask, subtasks })
    checkNumCalls({ create: 2, update: 0 })
  })

  runBothModes('create multiple subtasks, check appear in tree', () => {
    const subtasks: CreatedTask[] = []
    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    waitForCreate(rootTask)
    fillTaskForm(subtask)
    clickSubmitBtn()
    waitForCreate(subtask)
    subtasks.push(subtask)
    checkTaskFormSubtasks(subtasks)

    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    fillTaskForm(subtask2)
    clickSubmitBtn()
    waitForCreate(subtask2)
    subtasks.push(subtask2)
    checkTaskFormSubtasks(subtasks)

    clickSubmitBtn('Save') // TODO: bugfix: should be "Create"
    // waitForUpdate() // TODO: debug test

    checkTaskInTree({ ...rootTask, subtasks })
    checkNumCalls({ create: 3, update: 0 })
  })

  runBothModes('create nested subtasks, ensure appear in tree', () => {
    const subtasks: CreatedTask[] = []
    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    waitForCreate(subtask)
    fillTaskForm(subtask2)
    clickSubmitBtn()
    waitForCreate(subtask2)
    subtasks.push(subtask2)
    checkTaskFormSubtasks(subtasks)

    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    fillTaskForm(subtask3)
    clickSubmitBtn()
    waitForCreate(subtask3)
    subtasks.push(subtask3)
    checkTaskFormSubtasks(subtasks)

    clickSubmitBtn('Save') // TODO: bugfix: should be "Create"
    // waitForCreate(subtask) // TODO: debug test
    checkTaskFormSubtasks([subtask, subtask2, subtask3])

    clickSubmitBtn('Save') // TODO: bugfix: should be "Create"
    // waitForUpdate() // TODO: debug test

    checkTaskInTree({ ...rootTask, subtasks: [{ ...subtask, subtasks }] })
    checkNumCalls({ create: 4, update: 0 })
  })
})
