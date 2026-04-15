import { Routes } from '@client/lib/constants'
import { DefaultTask, Selectors } from '@cypress/support/constants'
import { isLoggedIn } from '@cypress/support/utils'
import {
  type CreatedTask,
  checkNumCalls,
  interceptCreate,
  interceptUpdate,
  waitForCreate,
} from '@cypress/support/utils/intercepts'
import {
  checkTaskFormSubtasks,
  clickSubmitBtnCreate,
  clickSubmitBtnUpdate,
  fillTaskForm,
} from '@cypress/support/utils/task-form'
import { checkTaskInTree } from '@cypress/support/utils/task-tree'

import { TaskStatus } from '~/shared/schema'

const { TaskForm, TaskCard } = Selectors

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

  it('create a subtask, check appears in tree', () => {
    const subtasks: CreatedTask[] = []
    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    waitForCreate(rootTask)
    fillTaskForm(subtask)
    clickSubmitBtnCreate(subtask)
    subtasks.push(subtask)
    checkTaskFormSubtasks(subtasks)

    clickSubmitBtnUpdate(rootTask) // TODO: bugfix: should be create

    checkTaskInTree({ ...rootTask, subtasks })
    checkNumCalls({ create: 2, update: 0 })

    // test EDIT
    cy.contains(TaskCard.CARD, rootTask.name).click()
    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    fillTaskForm(subtask2)
    clickSubmitBtnCreate(subtask2)
    subtasks.push(subtask2)
    checkTaskFormSubtasks(subtasks)

    clickSubmitBtnUpdate(rootTask)
    checkTaskInTree({ ...rootTask, subtasks })
    checkNumCalls({ create: 3, update: 1 })
  })

  it('create multiple subtasks, check appear in tree', () => {
    const subtasks: CreatedTask[] = []
    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    waitForCreate(rootTask)
    fillTaskForm(subtask)
    clickSubmitBtnCreate(subtask)
    subtasks.push(subtask)
    checkTaskFormSubtasks(subtasks)

    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    fillTaskForm(subtask2)
    clickSubmitBtnCreate(subtask2)
    subtasks.push(subtask2)
    checkTaskFormSubtasks(subtasks)

    clickSubmitBtnUpdate(rootTask) // TODO: bugfix: should be create

    checkTaskInTree({ ...rootTask, subtasks })
    checkNumCalls({ create: 3, update: 0 })

    // test EDIT
    cy.contains(TaskCard.CARD, rootTask.name).click()
    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    fillTaskForm(subtask3)
    clickSubmitBtnCreate(subtask3)
    subtasks.push(subtask3)
    checkTaskFormSubtasks(subtasks)

    clickSubmitBtnUpdate(rootTask)
    checkTaskInTree({ ...rootTask, subtasks })
    checkNumCalls({ create: 4, update: 1 })
  })

  it('create nested subtasks, ensure appear in tree', () => {
    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    waitForCreate(rootTask)
    fillTaskForm(subtask)

    const nestedSubtasks: CreatedTask[] = []
    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    waitForCreate(subtask)
    fillTaskForm(subtask2)
    clickSubmitBtnCreate(subtask2)
    nestedSubtasks.push(subtask2)
    checkTaskFormSubtasks(nestedSubtasks)

    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    fillTaskForm(subtask3)
    clickSubmitBtnCreate(subtask3)
    nestedSubtasks.push(subtask3)
    checkTaskFormSubtasks(nestedSubtasks)

    clickSubmitBtnUpdate(subtask) // TODO: bugfix: should be create
    checkTaskFormSubtasks([subtask, ...nestedSubtasks])

    clickSubmitBtnUpdate(rootTask) // TODO: bugfix: should be create

    checkTaskInTree({
      ...rootTask,
      subtasks: [{ ...subtask, subtasks: nestedSubtasks }],
    })
    checkNumCalls({ create: 4, update: 0 })

    // TODO: test EDIT
  })
})
