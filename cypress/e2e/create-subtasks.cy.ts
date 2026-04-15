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
import {
  checkTaskInTree,
  openTaskEditForm,
} from '@cypress/support/utils/task-tree'

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

  it('create a subtask, check appears in tree', () => {
    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    waitForCreate(rootTask)
    fillTaskForm(subtask)
    clickSubmitBtnCreate(subtask)
    checkTaskFormSubtasks([subtask])

    clickSubmitBtnUpdate(rootTask) // TODO: bugfix: should be create

    checkTaskInTree({ ...rootTask, subtasks: [subtask] })
    checkNumCalls({ create: 2, update: 0 })

    // test EDIT
    openTaskEditForm(rootTask)
    checkTaskFormSubtasks([subtask])

    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    fillTaskForm(subtask2)
    clickSubmitBtnCreate(subtask2)
    checkTaskFormSubtasks([subtask, subtask2])

    clickSubmitBtnUpdate(rootTask)
    cy.wait(500) //attempt wait
    checkTaskInTree({ ...rootTask, subtasks: [subtask, subtask2] })
    checkNumCalls({ create: 3, update: 1 })
  })

  it('create multiple subtasks, check appear in tree', () => {
    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    waitForCreate(rootTask)
    fillTaskForm(subtask)
    clickSubmitBtnCreate(subtask)
    checkTaskFormSubtasks([subtask])

    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    fillTaskForm(subtask2)
    clickSubmitBtnCreate(subtask2)
    checkTaskFormSubtasks([subtask, subtask2])

    clickSubmitBtnUpdate(rootTask) // TODO: bugfix: should be create

    checkTaskInTree({ ...rootTask, subtasks: [subtask, subtask2] })
    checkNumCalls({ create: 3, update: 0 })

    // test EDIT
    openTaskEditForm(rootTask)
    checkTaskFormSubtasks([subtask, subtask2])

    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    fillTaskForm(subtask3)
    clickSubmitBtnCreate(subtask3)
    checkTaskFormSubtasks([subtask, subtask2, subtask3])

    clickSubmitBtnUpdate(rootTask)
    cy.wait(500) //attempt wait
    checkTaskInTree({ ...rootTask, subtasks: [subtask, subtask2, subtask3] })
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
