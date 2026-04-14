import { Routes } from '@client/lib/constants'
import { DefaultTask, Selectors } from '@cypress/support/constants'
import { isLoggedIn, runBothModes } from '@cypress/support/utils'
import {
  checkNumCalls,
  interceptCreate,
  interceptUpdate,
  waitForCreate,
  waitForUpdate,
} from '@cypress/support/utils/intercepts'
import {
  assignSubtask,
  checkTaskFormSubtasks,
  clickSubmitBtn,
  fillTaskForm,
  type TaskFormData,
} from '@cypress/support/utils/task-form'
import { checkTaskInTree } from '@cypress/support/utils/task-tree'

const { TaskForm, TaskCard } = Selectors

describe('Assign Subtask', () => {
  const rootTask = {
    ...DefaultTask,
    name: 'E2E Root Task',
  } as const satisfies TaskFormData

  const orphanTask = {
    ...DefaultTask,
    name: 'E2E Orphan Task 1',
  } as const satisfies TaskFormData

  const orphanTask2 = {
    ...DefaultTask,
    name: 'E2E Orphan Task 2',
  } as const satisfies TaskFormData

  const newSubtask = {
    ...DefaultTask,
    name: 'E2E Brand New Subtask',
  } as const satisfies TaskFormData

  beforeEach(() => {
    interceptCreate()
    interceptUpdate()

    const loggedIn = isLoggedIn()
    cy.visit(loggedIn ? Routes.HOME : Routes.GUEST)

    // Create the orphan tasks
    cy.get(Selectors.CREATE_TASK_BTN).click()
    fillTaskForm(orphanTask)
    clickSubmitBtn()
    waitForCreate(orphanTask)

    cy.get(Selectors.CREATE_TASK_BTN).click()
    fillTaskForm(orphanTask2)
    clickSubmitBtn()
    waitForCreate(orphanTask2)
  })

  runBothModes(
    'assign an existing orphaned task as a subtask of a task',
    () => {
      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(rootTask)
      const subtasks: TaskFormData[] = []

      assignSubtask(orphanTask)
      subtasks.push(orphanTask)
      waitForUpdate()
      checkTaskFormSubtasks(subtasks)

      // add a brand-new subtask via the add button (just to test that it works alongside the assign flow)
      cy.get(TaskForm.ADD_SUBTASK_BTN).click()
      fillTaskForm(newSubtask)
      clickSubmitBtn()
      waitForCreate(newSubtask)
      subtasks.push(newSubtask)
      checkTaskFormSubtasks(subtasks)

      clickSubmitBtn() // TODO: try cancel and ensure wasn't assigned.
      checkTaskInTree({ ...rootTask, subtasks: [orphanTask] })
      checkNumCalls({ create: 2, update: 1 })

      // test in edit mode
      cy.contains(TaskCard.CARD, rootTask.name).click()
      checkTaskFormSubtasks(subtasks)
      assignSubtask(orphanTask2)
      waitForUpdate()
      subtasks.push(orphanTask2)
      checkTaskFormSubtasks(subtasks)

      clickSubmitBtn()
      checkTaskInTree({ ...rootTask, subtasks })
      checkNumCalls({ create: 3, update: 2 })
    },
  )
})
