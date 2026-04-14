import { Routes } from '@client/lib/constants'
import { DefaultTask, Selectors } from '@cypress/support/constants'
import { isLoggedIn, runBothModes } from '@cypress/support/utils'
import {
  checkNumCalls,
  interceptCreate,
  interceptUpdate,
  waitForCreate,
} from '@cypress/support/utils/intercepts'
import {
  checkTaskFormSubtasks,
  clickSubmitBtn,
  fillTaskForm,
  type TaskFormData,
} from '@cypress/support/utils/task-form'
import { checkTaskInTree } from '@cypress/support/utils/task-tree'

const { TaskForm, TaskCard } = Selectors

describe('Create Subtask', () => {
  const rootTask = {
    ...DefaultTask,
    name: 'E2E Root Level Task',
  } as const satisfies TaskFormData

  const subtask = {
    ...DefaultTask,
    name: 'E2E Subtask 1',
  } as const satisfies TaskFormData

  const subtask2 = {
    ...DefaultTask,
    name: 'E2E Subtask 2',
  } as const satisfies TaskFormData

  const subtask3 = {
    ...DefaultTask,
    name: 'E2E Subtask 3',
  } as const satisfies TaskFormData

  beforeEach(() => {
    interceptCreate()
    interceptUpdate()

    const loggedIn = isLoggedIn()
    cy.visit(loggedIn ? Routes.HOME : Routes.GUEST)

    cy.get(Selectors.CREATE_TASK_BTN).click()
    fillTaskForm(rootTask)
  })

  runBothModes('create a subtask, check appears in tree', () => {
    const subtasks: TaskFormData[] = []
    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    waitForCreate(rootTask)
    fillTaskForm(subtask)
    clickSubmitBtn()
    waitForCreate(subtask)
    subtasks.push(subtask)
    checkTaskFormSubtasks(subtasks)

    clickSubmitBtn()
    waitForCreate(rootTask)

    checkTaskInTree({ ...rootTask, subtasks })
    checkNumCalls({ create: 2, update: 0 })

    // test EDIT
    cy.contains(TaskCard.CARD, rootTask.name).click()
    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    fillTaskForm(subtask2)
    clickSubmitBtn()
    waitForCreate(subtask2)
    subtasks.push(subtask2)
    checkTaskFormSubtasks(subtasks)

    clickSubmitBtn()
    checkTaskInTree({ ...rootTask, subtasks })
    checkNumCalls({ create: 3, update: 1 })
  })

  runBothModes('create multiple subtasks, check appear in tree', () => {
    const subtasks: TaskFormData[] = []

    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    waitForCreate(rootTask)
    fillTaskForm(subtask)
    clickSubmitBtn()
    waitForCreate(subtask)
    subtasks.push(subtask)
    checkTaskFormSubtasks(subtasks)

    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    fillTaskForm(subtask2)
    clickSubmitBtn()
    waitForCreate(subtask2)
    subtasks.push(subtask2)
    checkTaskFormSubtasks(subtasks)

    clickSubmitBtn()
    waitForCreate(rootTask)

    checkTaskInTree({ ...rootTask, subtasks })
    checkNumCalls({ create: 3, update: 0 })

    // test EDIT
    cy.contains(TaskCard.CARD, rootTask.name).click()
    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    fillTaskForm(subtask3)
    clickSubmitBtn()
    waitForCreate(subtask3)
    subtasks.push(subtask3)
    checkTaskFormSubtasks(subtasks)

    clickSubmitBtn()
    checkTaskInTree({ ...rootTask, subtasks })
    checkNumCalls({ create: 4, update: 1 })
  })

  runBothModes('create nested subtasks, ensure appear in tree', () => {
    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    waitForCreate(rootTask)
    fillTaskForm(subtask)

    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    waitForCreate(subtask)
    fillTaskForm(subtask2)
    clickSubmitBtn()
    waitForCreate(subtask2)
    checkTaskFormSubtasks([subtask2])

    cy.get(TaskForm.ADD_SUBTASK_BTN).click()
    fillTaskForm(subtask3)
    clickSubmitBtn()
    waitForCreate(subtask3)
    checkTaskFormSubtasks([subtask2, subtask3])

    clickSubmitBtn()
    waitForCreate(subtask)
    checkTaskFormSubtasks([subtask, subtask2, subtask3])

    clickSubmitBtn()
    waitForCreate(rootTask)

    checkTaskInTree({
      ...rootTask,
      subtasks: [{ ...subtask, subtasks: [subtask2, subtask3] }],
    })
    checkNumCalls({ create: 4, update: 0 })

    // TODO: test EDIT
  })
})
