import { Routes } from '@client/lib/constants'
import { DefaultTask, Selectors } from '@cypress/support/constants'
import { checkTasksExistBackend, isLoggedIn } from '@cypress/support/utils'
import {
  type CreatedTask,
  checkNumCalls,
} from '@cypress/support/utils/intercepts'
import { goToCompletedPage } from '@cypress/support/utils/navigation'
import {
  checkTaskFormSubtasks,
  clickSubmitBtnCreate,
  clickSubmitBtnUpdate,
  fillTaskForm,
  getTaskForm,
} from '@cypress/support/utils/task-form'
import {
  changeStatusViaStatusChangeDialog,
  expandAndCheckTree,
  openTaskEditForm,
} from '@cypress/support/utils/task-tree'

import { TaskStatus } from '~/shared/schema'

const { TaskForm } = Selectors

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

  const createUncompletedSubtask = () => {
    cy.log('Create root task with uncompleted subtask')
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

    checkNumCalls({ create: 2, update: 0 })
  }

  beforeEach(() => {
    const loggedIn = isLoggedIn()
    cy.visit(loggedIn ? Routes.HOME : Routes.GUEST)
  })

  for (const { testTitle, markSubtaskComplete } of [
    {
      testTitle: 'complete subtask via New Task Form',
      markSubtaskComplete: () => {
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
          checkTaskFormSubtasks([completedSubtask])
          clickSubmitBtnCreate({ newTasks: [rootTask, completedSubtask] })
        })

        checkNumCalls({ create: 2, update: 0 })
      },
    },
    {
      testTitle: 'complete subtask via Edit Form',
      markSubtaskComplete: () => {
        createUncompletedSubtask()
        expandAndCheckTree({ ...rootTask, subtasks: [subtask] }) // expands the tree

        openTaskEditForm(subtask)
        cy.get(TaskForm.MARK_COMPLETED_CHECKBOX).click()
        clickSubmitBtnUpdate({
          updatedTasks: [{ ...subtask, status: TaskStatus.COMPLETED }],
        })
        checkNumCalls({ create: 2, update: 1 })
      },
    },
    {
      testTitle: 'complete subtask via Change Status Dialog',
      markSubtaskComplete: () => {
        createUncompletedSubtask()
        expandAndCheckTree({ ...rootTask, subtasks: [subtask] }) // expands the tree
        changeStatusViaStatusChangeDialog(subtask, TaskStatus.COMPLETED)
        checkNumCalls({ create: 2, update: 1 })
      },
    },
  ] as const) {
    it(`${testTitle} - present in main tree as crossed out, not in completed page`, () => {
      markSubtaskComplete()
      expandAndCheckTree({ ...rootTask, subtasks: [completedSubtask] })
      checkTasksExistBackend([completedSubtask])

      goToCompletedPage()
      cy.contains(subtask.name).should('not.exist')
      cy.contains(rootTask.name).should('not.exist')
    })
  }
})
