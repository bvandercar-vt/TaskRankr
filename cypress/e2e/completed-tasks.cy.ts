import { Routes } from '@client/lib/constants'
import { DefaultTask, Selectors } from '@cypress/support/constants'
import { isLoggedIn } from '@cypress/support/utils'
import {
  type CreatedTask,
  checkNumCalls,
} from '@cypress/support/utils/intercepts'
import { goToCompletedPage } from '@cypress/support/utils/navigation'
import {
  clickSubmitBtnCreate,
  clickSubmitBtnUpdate,
  fillTaskForm,
} from '@cypress/support/utils/task-form'
import {
  checkTaskInTree,
  openStatusChangeDialog,
  openTaskEditForm,
} from '@cypress/support/utils/task-tree'

import { TaskStatus } from '~/shared/schema'

const { TaskForm, ChangeStatusDialog } = Selectors

describe('Completed Tasks', () => {
  const taskCompleted = {
    ...DefaultTask,
    name: 'E2E Completed Task',
    status: TaskStatus.COMPLETED,
  } as const satisfies CreatedTask

  const taskOpen = {
    ...DefaultTask,
    name: 'E2E Task To Complete',
    status: TaskStatus.PINNED,
  } as const satisfies CreatedTask

  beforeEach(() => {
    const loggedIn = isLoggedIn()
    cy.visit(loggedIn ? Routes.HOME : Routes.GUEST)
  })

  for (const { contextName, setupTask, createTask } of [
    {
      contextName: 'New Task',
      setupTask: () => {
        cy.get(Selectors.CREATE_TASK_BTN).click()
        fillTaskForm(taskCompleted)
        cy.get(TaskForm.MARK_COMPLETED_CHECKBOX).click()
        clickSubmitBtnCreate({ newTasks: [taskCompleted] })
        checkNumCalls({ create: 1, update: 0 })
      },
      createTask: taskCompleted,
    },
    {
      contextName: 'Edit Task via Form',
      setupTask: () => {
        cy.get(Selectors.CREATE_TASK_BTN).click()
        fillTaskForm(taskOpen)
        clickSubmitBtnCreate({ newTasks: [taskOpen] })
        checkNumCalls({ create: 1, update: 0 })

        openTaskEditForm(taskOpen)
        cy.get(TaskForm.MARK_COMPLETED_CHECKBOX).click()
        clickSubmitBtnUpdate()
        checkNumCalls({ create: 1, update: 1 })
      },
      createTask: taskOpen,
    },
    {
      contextName: 'Edit Task via Status Dialog',
      setupTask: () => {
        cy.get(Selectors.CREATE_TASK_BTN).click()
        fillTaskForm(taskOpen)
        clickSubmitBtnCreate({ newTasks: [taskOpen] })
        checkNumCalls({ create: 1, update: 0 })

        openStatusChangeDialog(taskOpen)
        cy.get(ChangeStatusDialog.COMPLETE_BTN).click()
        checkNumCalls({ create: 1, update: 1 })
      },
      createTask: taskOpen,
    },
  ] as const) {
    context(contextName, () => {
      it('mark task as completed — not in main tree, visible on completed page', () => {
        setupTask()

        cy.contains(createTask.name).should('not.exist')

        goToCompletedPage()
        checkTaskInTree({ name: createTask.name })
      })
    })
  }
})
