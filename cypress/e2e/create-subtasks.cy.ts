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
  getTaskForm,
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
    getTaskForm(0).within(() => {
      fillTaskForm(rootTask)
    })
  })

  it('create a subtask, check appears in tree', () => {
    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    getTaskForm(1).within(() => {
      fillTaskForm(subtask)
      clickSubmitBtnCreate(subtask)
    })

    getTaskForm(0).within(() => {
      checkTaskFormSubtasks([subtask])
      clickSubmitBtnCreate(rootTask)
      waitForCreate([rootTask, subtask])
    })

    checkTaskInTree({ ...rootTask, subtasks: [subtask] })
    checkNumCalls({ create: 2, update: 0 })

    // test EDIT
    openTaskEditForm(rootTask)
    getTaskForm(0).within(() => {
      checkTaskFormSubtasks([subtask])
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    })

    getTaskForm(1).within(() => {
      fillTaskForm(subtask2)
      clickSubmitBtnCreate(subtask2)
    })

    getTaskForm(0).within(() => {
      checkTaskFormSubtasks([subtask, subtask2])
      clickSubmitBtnUpdate()
    })

    checkTaskInTree({ ...rootTask, subtasks: [subtask, subtask2] })
    checkNumCalls({ create: 3, update: 0 })
  })

  it('create multiple subtasks, check appear in tree', () => {
    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    getTaskForm(1).within(() => {
      fillTaskForm(subtask)
      clickSubmitBtnCreate(subtask)
    })

    getTaskForm(0).within(() => {
      checkTaskFormSubtasks([subtask])
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    })

    getTaskForm(1).within(() => {
      fillTaskForm(subtask2)
      clickSubmitBtnCreate(subtask2)
    })

    getTaskForm(0).within(() => {
      checkTaskFormSubtasks([subtask, subtask2])
      clickSubmitBtnCreate(subtask)
      waitForCreate([rootTask, subtask, subtask2])
    })

    checkTaskInTree({ ...rootTask, subtasks: [subtask, subtask2] })
    checkNumCalls({ create: 3, update: 0 })

    // test EDIT
    openTaskEditForm(rootTask)
    getTaskForm(0).within(() => {
      checkTaskFormSubtasks([subtask, subtask2])
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    })

    getTaskForm(1).within(() => {
      fillTaskForm(subtask3)
      clickSubmitBtnCreate(subtask3)
    })

    getTaskForm(0).within(() => {
      checkTaskFormSubtasks([subtask, subtask2, subtask3])
      clickSubmitBtnUpdate()
    })

    checkTaskInTree({ ...rootTask, subtasks: [subtask, subtask2, subtask3] })
    checkNumCalls({ create: 4, update: 0 })
  })

  it('create nested subtasks, ensure appear in tree', () => {
    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    getTaskForm(1).within(() => {
      fillTaskForm(subtask)
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    })

    getTaskForm(2).within(() => {
      fillTaskForm(subtask2)
      clickSubmitBtnCreate(subtask2)
    })

    getTaskForm(1).within(() => {
      checkTaskFormSubtasks([subtask2])
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    })

    getTaskForm(2).within(() => {
      fillTaskForm(subtask3)
      clickSubmitBtnCreate(subtask3)
    })

    getTaskForm(1).within(() => {
      checkTaskFormSubtasks([subtask2, subtask3])
      clickSubmitBtnCreate(subtask)
    })

    getTaskForm(0).within(() => {
      checkTaskFormSubtasks([subtask, subtask2, subtask3])
      clickSubmitBtnCreate(rootTask)
      waitForCreate([rootTask, subtask, subtask2, subtask3])
    })

    checkTaskInTree({
      ...rootTask,
      subtasks: [{ ...subtask, subtasks: [subtask2, subtask3] }],
    })
    checkNumCalls({ create: 4, update: 0 })

    // TODO: test EDIT
  })
})
