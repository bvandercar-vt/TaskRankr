import { Routes } from '@client/lib/constants'
import { DefaultTask, Selectors } from '@cypress/support/constants'
import { checkTasksExistBackend } from '@cypress/support/utils/api'
import {
  type CreatedTask,
  checkNumCalls,
  interceptCreate,
  interceptUpdate,
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

describe('Task Form Cancellation', () => {
  beforeEach(() => {
    interceptCreate()
    interceptUpdate()

    const loggedIn = isLoggedIn()
    cy.visit(loggedIn ? Routes.HOME : Routes.GUEST)
  })

  for (const { contextName, beforeEachHook, afterEachHook } of [
    {
      contextName: 'New Task',
      beforeEachHook: () => {
        cy.get(Selectors.CREATE_TASK_BTN).click()
        getTaskForm(0).within(() => {
          fillTaskForm(rootTask)
        })
      },
      afterEachHook: () => {
        checkTasksDontExist([rootTask, subtask, subtask2])
        checkNumCalls({ create: 0, update: 0 })
      },
    },
    {
      contextName: 'Edit Task',
      beforeEachHook: () => {
        cy.get(Selectors.CREATE_TASK_BTN).click()
        getTaskForm(0).within(() => {
          fillTaskForm(rootTask)
          clickSubmitBtnCreate({ newTasks: [rootTask] })
        })

        openTaskEditForm(rootTask)
        checkNumCalls({ create: 1, update: 0 })
      },
      afterEachHook: () => {
        checkTasksDontExist([subtask, subtask2])
        checkNumCalls({ create: 1, update: 0 })
      },
    },
  ] as const) {
    context(contextName, () => {
      beforeEach(beforeEachHook)
      afterEach(() => {
        afterEachHook()
        cy.get(TaskForm.CANCEL_CONFIRM_DIALOG).should('not.exist')
        cy.get(TaskForm.FORM).should('not.exist')
      })

      if (contextName === 'New Task') {
        it('cancel on create form before adding any subtask — dialog closes, no task created', () => {
          getTaskForm(0).within(() => {
            cy.get(TaskForm.CANCEL_BTN).click()
          })
        })
      }

      it('cancel on parent form after a subtask was added — confirmation dialog appears, discard removes all', () => {
        getTaskForm(0).within(() => {
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
          .should('contain.text', '1 unsaved subtask')
        cy.get(TaskForm.CANCEL_CONFIRM_BTN).click()
      })

      it('cancel on parent form after multiple subtasks were added — confirmation shows correct count, discard removes all', () => {
        getTaskForm(0).within(() => {
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

        cy.log('**testing cancel deny**')
        cy.get(TaskForm.CANCEL_CONFIRM_DIALOG)
          .should('be.visible')
          .should('contain.text', '2 unsaved subtasks')
        cy.get(TaskForm.CANCEL_DENY_BTN).click()

        getTaskForm(0).within(() => {
          cy.get(TaskForm.NAME_INPUT).should('have.value', rootTask.name)
          checkTaskFormSubtasks([subtask, subtask2])
          cy.get(TaskForm.CANCEL_BTN).click()
        })

        cy.log('**testing cancel confirm**')
        cy.get(TaskForm.CANCEL_CONFIRM_DIALOG)
          .should('be.visible')
          .should('contain.text', '2 unsaved subtasks')
        cy.get(TaskForm.CANCEL_CONFIRM_BTN).click()
        cy.get(TaskForm.CANCEL_CONFIRM_DIALOG).should('not.exist')
        cy.get(TaskForm.FORM).should('not.exist')
      })

      it('cancel on subtask form navigates back to parent, then cancel on parent discards all without confirmation', () => {
        getTaskForm(0).within(() => {
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
      })
    })
  }
})
