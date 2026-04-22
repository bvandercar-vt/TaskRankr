import { Routes } from '@client/lib/constants'
import { DefaultTask, Selectors } from '@cypress/support/constants'
import { isLoggedIn } from '@cypress/support/utils'
import {
  type CreatedTask,
  checkNumCalls,
  interceptCreate,
  interceptUpdate,
} from '@cypress/support/utils/intercepts'
import {
  clickSubmitBtnCreate,
  clickSubmitBtnUpdate,
  fillTaskForm,
  getTaskForm,
} from '@cypress/support/utils/task-form'
import {
  checkTaskInTree,
  getTaskCardTitle,
  openStatusChangeDialog,
  openTaskEditForm,
} from '@cypress/support/utils/task-tree'

import { TaskStatus } from '~/shared/schema'

const { TaskForm } = Selectors

const MENU_ITEM_COMPLETED = '[data-testid="menu-item-completed"]'

const goToCompletedPage = () => {
  cy.get(Selectors.MENU_BTN).click()
  cy.get(MENU_ITEM_COMPLETED).click()
}

describe('Completed Subtasks', () => {
  const rootTask = {
    ...DefaultTask,
    name: 'E2E Root Task',
    status: TaskStatus.PINNED,
  } as const satisfies CreatedTask

  const subtask = {
    ...DefaultTask,
    name: 'E2E Subtask',
    status: TaskStatus.OPEN,
  } as const satisfies CreatedTask

  const completedSubtask = {
    ...subtask,
    status: TaskStatus.COMPLETED,
  } as const satisfies CreatedTask

  beforeEach(() => {
    interceptCreate()
    interceptUpdate()

    const loggedIn = isLoggedIn()
    cy.visit(loggedIn ? Routes.HOME : Routes.GUEST)
  })

  it('create a completed subtask — crossed out in form and tree, not on completed page', () => {
    cy.get(Selectors.CREATE_TASK_BTN).click()
    getTaskForm(0).within(() => {
      fillTaskForm(rootTask)
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    })

    getTaskForm(1).within(() => {
      fillTaskForm(subtask)
      cy.get(TaskForm.MARK_COMPLETED_CHECKBOX).click()
      clickSubmitBtnCreate()
    })

    getTaskForm(0).within(() => {
      cy.contains(`${TaskForm.SUBTASK_ROW} span`, subtask.name).should(
        'have.class',
        'line-through',
      )
      clickSubmitBtnCreate({ newTasks: [rootTask, completedSubtask] })
    })

    checkTaskInTree({ ...rootTask, subtasks: [completedSubtask] })
    getTaskCardTitle(completedSubtask).should('have.class', 'line-through')
    checkNumCalls({ create: 2, update: 0 })

    goToCompletedPage()
    cy.contains(subtask.name).should('not.exist')
  })

  const setupRootWithSubtask = () => {
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
      clickSubmitBtnCreate({ newTasks: [rootTask, subtask] })
    })

    checkTaskInTree({ ...rootTask, subtasks: [subtask] })
    checkNumCalls({ create: 2, update: 0 })
  }

  for (const { contextName, markSubtaskComplete } of [
    {
      contextName: 'Edit via Form',
      markSubtaskComplete: () => {
        openTaskEditForm(subtask)
        cy.get(TaskForm.MARK_COMPLETED_CHECKBOX).click()
        clickSubmitBtnUpdate()
        checkNumCalls({ create: 2, update: 1 })
      },
    },
    {
      contextName: 'Edit via Status Dialog',
      markSubtaskComplete: () => {
        openStatusChangeDialog(subtask)
        cy.get('[data-testid="button-complete-task"]').click()
        checkNumCalls({ create: 2, update: 1 })
      },
    },
  ] as const) {
    context(contextName, () => {
      it('create uncompleted subtask, mark completed — crossed out in tree', () => {
        setupRootWithSubtask()
        markSubtaskComplete()

        checkTaskInTree({ ...rootTask, subtasks: [completedSubtask] })
        getTaskCardTitle(completedSubtask).should('have.class', 'line-through')
      })
    })
  }
})
