import { Routes } from '@client/lib/constants'
import { DefaultTask, Selectors } from '@cypress/support/constants'
import { isLoggedIn } from '@cypress/support/utils'
import {
  type CreatedTask,
  checkNumCalls,
  interceptCreate,
  interceptUpdate,
  waitForUpdate,
} from '@cypress/support/utils/intercepts'
import {
  assignSubtask,
  checkTaskFormSubtasks,
  clickSubmitBtnCreate,
  clickSubmitBtnUpdate,
  fillTaskForm,
} from '@cypress/support/utils/task-form'
import { checkTaskInTree } from '@cypress/support/utils/task-tree'

import { TaskStatus } from '~/shared/schema'

const { TaskForm } = Selectors

describe('Assign Subtasks', () => {
  const rootTask = {
    ...DefaultTask,
    name: 'E2E Root Task',
    status: TaskStatus.PINNED,
  } as const satisfies CreatedTask

  const orphanTask = {
    ...DefaultTask,
    name: 'E2E Orphan Task 1',
    status: TaskStatus.PINNED,
  } as const satisfies CreatedTask

  const orphanTask2 = {
    ...DefaultTask,
    name: 'E2E Orphan Task 2',
    status: TaskStatus.PINNED,
  } as const satisfies CreatedTask

  const newSubtask = {
    ...DefaultTask,
    name: 'E2E Brand New Subtask',
    status: TaskStatus.OPEN,
  } as const satisfies CreatedTask

  beforeEach(() => {
    interceptCreate()
    interceptUpdate()

    const loggedIn = isLoggedIn()
    cy.visit(loggedIn ? Routes.HOME : Routes.GUEST)

    // Create the orphan tasks
    cy.get(Selectors.CREATE_TASK_BTN).click()
    fillTaskForm(orphanTask)
    clickSubmitBtnCreate(orphanTask)

    cy.get(Selectors.CREATE_TASK_BTN).click()
    fillTaskForm(orphanTask2)
    clickSubmitBtnCreate(orphanTask2)
  })

  it('assign an existing orphaned task as a subtask of a task', () => {
    cy.get(Selectors.CREATE_TASK_BTN).click()
    fillTaskForm(rootTask)
    const subtasks: CreatedTask[] = []

    assignSubtask(orphanTask)
    subtasks.push(orphanTask)
    waitForUpdate(orphanTask)
    checkTaskFormSubtasks(subtasks)

    // add a brand-new subtask via the add button (just to test that it works alongside the assign flow)
    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    fillTaskForm(newSubtask)
    clickSubmitBtnCreate(newSubtask)
    subtasks.push(newSubtask)
    checkTaskFormSubtasks(subtasks)

    clickSubmitBtnUpdate(rootTask) // TODO: bugfix: should be create
    checkTaskInTree({ ...rootTask, subtasks })
    checkNumCalls({ create: 2, update: 1 })

    // test EDIT
    // cy.contains(TaskCard.CARD, rootTask.name).click()
    // checkTaskFormSubtasks(subtasks)
    // assignSubtask(orphanTask2)
    // waitForUpdate(orphanTask2)
    // subtasks.push(orphanTask2)
    // checkTaskFormSubtasks(subtasks)

    // clickSubmitBtnCreate(rootTask)
    // checkTaskInTree({ ...rootTask, subtasks })
    // checkNumCalls({ create: 3, update: 2 })
  })
})
