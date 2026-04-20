import { Routes } from '@client/lib/constants'
import { DefaultTask, Selectors } from '@cypress/support/constants'
import { checkTasksExistBackend } from '@cypress/support/utils/api'
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
  fillTaskForm,
  getTaskForm,
} from '@cypress/support/utils/task-form'
import { openTaskEditForm } from '@cypress/support/utils/task-tree'
import { isLoggedIn } from '@cypress/support/utils/test-runner'

import { TaskStatus } from '~/shared/schema'

const { TaskForm } = Selectors

const rootTask = {
  ...DefaultTask,
  name: 'E2E Root Task',
  status: TaskStatus.PINNED,
} as const satisfies CreatedTask

const subtask = {
  ...DefaultTask,
  name: 'E2E Subtask 1',
  status: TaskStatus.OPEN,
} as const satisfies CreatedTask

const subtask2 = {
  ...subtask,
  name: 'E2E Subtask 2',
} as const satisfies CreatedTask

const checkTasksDontExist = (tasks: CreatedTask[]) => {
  tasks.forEach((task) => {
    cy.contains(task.name).should('not.exist')
  })
  checkTasksExistBackend(tasks, false)
}

describe('Task Creation Cancellation', () => {
  beforeEach(() => {
    interceptCreate()
    interceptUpdate()

    const loggedIn = isLoggedIn()
    cy.visit(loggedIn ? Routes.HOME : Routes.GUEST)
  })

  it('cancel on create form before adding any subtask — dialog closes, no task created', () => {
    cy.get(Selectors.CREATE_TASK_BTN).click()
    getTaskForm(0).within(() => {
      fillTaskForm(rootTask)
      cy.get(TaskForm.CANCEL_BTN).click()
    })

    checkTasksDontExist([rootTask])
    checkNumCalls({ create: 0, update: 0 })
  })

  it('cancel on parent form after a subtask was added — confirmation dialog appears, discard removes all', () => {
    cy.get(Selectors.CREATE_TASK_BTN).click()
    getTaskForm(0).within(() => {
      fillTaskForm(rootTask)
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    })

    getTaskForm(1).within(() => {
      fillTaskForm(subtask)
      clickSubmitBtnCreate()
    })

    getTaskForm(0).within(() => {
      checkTaskFormSubtasks([subtask])
      cy.get(TaskForm.CANCEL_BTN).click()
    })

    cy.get(TaskForm.CANCEL_CONFIRM_DIALOG)
      .should('be.visible')
      .should('contain.text', '1 subtask')
    cy.get(TaskForm.CANCEL_CONFIRM_BTN).click()

    checkTasksDontExist([rootTask, subtask])
    checkNumCalls({ create: 0, update: 0 })
  })

  it('cancel on parent form after multiple subtasks were added — confirmation shows correct count, discard removes all', () => {
    cy.get(Selectors.CREATE_TASK_BTN).click()
    getTaskForm(0).within(() => {
      fillTaskForm(rootTask)
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    })

    getTaskForm(1).within(() => {
      fillTaskForm(subtask)
      clickSubmitBtnCreate()
    })

    getTaskForm(0).within(() => {
      checkTaskFormSubtasks([subtask])
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    })

    getTaskForm(1).within(() => {
      fillTaskForm(subtask2)
      clickSubmitBtnCreate()
    })

    getTaskForm(0).within(() => {
      checkTaskFormSubtasks([subtask, subtask2])
      cy.get(TaskForm.CANCEL_BTN).click()
    })

    cy.get(TaskForm.CANCEL_CONFIRM_DIALOG)
      .should('be.visible')
      .should('contain.text', '2 subtasks')
      .should('be.visible ')
    cy.get(TaskForm.CANCEL_CONFIRM_BTN).click()

    checkTasksDontExist([rootTask, subtask, subtask2])
    checkNumCalls({ create: 0, update: 0 })
  })

  it('cancel on subtask form navigates back to parent, then cancel on parent discards all without confirmation', () => {
    cy.get(Selectors.CREATE_TASK_BTN).click()
    getTaskForm(0).within(() => {
      fillTaskForm(rootTask)
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    })

    getTaskForm(1).within(() => {
      cy.get(TaskForm.NAME_INPUT).type(subtask.name)
      cy.get(TaskForm.CANCEL_BTN).click()
    })

    getTaskForm(0).within(() => {
      cy.get(TaskForm.NAME_INPUT).should('have.value', rootTask.name)
      cy.get(TaskForm.CANCEL_BTN).click()
    })

    checkTasksDontExist([rootTask, subtask])
    checkNumCalls({ create: 0, update: 0 })
  })

  it('cancel confirmation "Go Back" returns to parent form without discarding', () => {
    cy.get(Selectors.CREATE_TASK_BTN).click()
    getTaskForm(0).within(() => {
      fillTaskForm(rootTask)
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    })

    getTaskForm(1).within(() => {
      fillTaskForm(subtask)
      clickSubmitBtnCreate()
    })

    getTaskForm(0).within(() => {
      checkTaskFormSubtasks([subtask])
      cy.get(TaskForm.CANCEL_BTN).click()
    })

    cy.get(TaskForm.CANCEL_CONFIRM_DIALOG).should('be.visible')
    cy.get(TaskForm.CANCEL_DENY_BTN).click()

    getTaskForm(0).within(() => {
      cy.get(TaskForm.NAME_INPUT).should('have.value', rootTask.name)
      checkTaskFormSubtasks([subtask])
    })

    checkTasksDontExist([rootTask, subtask])
    checkNumCalls({ create: 0, update: 0 })
  })
})

describe('Task Edit Cancellation', () => {
  const editRootTask = {
    ...DefaultTask,
    name: 'E2E Edit Root Task',
    status: TaskStatus.PINNED,
  } as const satisfies CreatedTask

  const newSubtask = {
    ...DefaultTask,
    name: 'E2E New Edit Subtask 1',
    status: TaskStatus.OPEN,
  } as const satisfies CreatedTask

  const newSubtask2 = {
    ...DefaultTask,
    name: 'E2E New Edit Subtask 2',
    status: TaskStatus.OPEN,
  } as const satisfies CreatedTask

  beforeEach(() => {
    interceptCreate()
    interceptUpdate()

    const loggedIn = isLoggedIn()
    cy.visit(loggedIn ? Routes.HOME : Routes.GUEST)

    cy.get(Selectors.CREATE_TASK_BTN).click()
    getTaskForm(0).within(() => {
      fillTaskForm(editRootTask)
      clickSubmitBtnCreate()
      waitForCreate([editRootTask])
    })

    openTaskEditForm(editRootTask)
  })

  it('cancel on edit form after adding subtask — confirmation dialog appears, discard removes new subtask', () => {
    getTaskForm(0).within(() => {
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    })

    getTaskForm(1).within(() => {
      fillTaskForm(newSubtask)
      clickSubmitBtnCreate()
    })

    getTaskForm(0).within(() => {
      checkTaskFormSubtasks([newSubtask])
      checkTasksExistBackend([newSubtask], false)
      cy.get(TaskForm.CANCEL_BTN).click()
    })

    cy.get(TaskForm.CANCEL_CONFIRM_DIALOG)
      .should('be.visible')
      .should('contain.text', '1 subtask')
    cy.get(TaskForm.CANCEL_CONFIRM_BTN).click()

    cy.contains(newSubtask.name).should('not.exist')
    checkTasksExistBackend([newSubtask], false)
    checkNumCalls({ create: 1, update: 0 })
  })

  it('cancel on edit form after adding multiple subtasks — confirmation shows correct count, discard removes all', () => {
    getTaskForm(0).within(() => {
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    })

    getTaskForm(1).within(() => {
      fillTaskForm(newSubtask)
      clickSubmitBtnCreate()
    })

    getTaskForm(0).within(() => {
      checkTaskFormSubtasks([newSubtask])
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    })

    getTaskForm(1).within(() => {
      fillTaskForm(newSubtask2)
      clickSubmitBtnCreate()
    })

    getTaskForm(0).within(() => {
      checkTaskFormSubtasks([newSubtask, newSubtask2])
      checkTasksExistBackend([newSubtask, newSubtask2], false)
      cy.get(TaskForm.CANCEL_BTN).click()
    })

    cy.get(TaskForm.CANCEL_CONFIRM_DIALOG)
      .should('be.visible')
      .should('contain.text', '2 subtasks')
    cy.get(TaskForm.CANCEL_CONFIRM_BTN).click()

    cy.contains(newSubtask.name).should('not.exist')
    cy.contains(newSubtask2.name).should('not.exist')
    checkTasksExistBackend([newSubtask, newSubtask2], false)
    checkNumCalls({ create: 1, update: 0 })
  })

  it('cancel on subtask form during edit — navigates back to edit form without confirmation', () => {
    getTaskForm(0).within(() => {
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    })

    getTaskForm(1).within(() => {
      cy.get(TaskForm.NAME_INPUT).type(newSubtask.name)
      cy.get(TaskForm.CANCEL_BTN).click()
    })

    getTaskForm(0).within(() => {
      cy.get(TaskForm.NAME_INPUT).should('have.value', editRootTask.name)
      cy.get(TaskForm.SUBTASK_ROW).should('not.exist')
    })

    cy.get(TaskForm.CANCEL_CONFIRM_DIALOG).should('not.exist')
    checkTasksExistBackend([newSubtask], false)
    checkNumCalls({ create: 1, update: 0 })
  })

  it('cancel confirmation "Go Back" during edit — returns to edit form with pending subtask still shown', () => {
    getTaskForm(0).within(() => {
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    })

    getTaskForm(1).within(() => {
      fillTaskForm(newSubtask)
      clickSubmitBtnCreate()
    })

    getTaskForm(0).within(() => {
      checkTaskFormSubtasks([newSubtask])
      cy.get(TaskForm.CANCEL_BTN).click()
    })

    cy.get(TaskForm.CANCEL_CONFIRM_DIALOG).should('be.visible')
    cy.get(TaskForm.CANCEL_DENY_BTN).click()

    getTaskForm(0).within(() => {
      cy.get(TaskForm.NAME_INPUT).should('have.value', editRootTask.name)
      checkTaskFormSubtasks([newSubtask])
    })

    checkTasksExistBackend([newSubtask], false)
    checkNumCalls({ create: 1, update: 0 })
  })
})
