import { Routes } from '@client/lib/constants'
import {
  DefaultTask,
  FieldConfigAllFalse,
  Selectors,
} from '@cypress/support/constants'
import { isLoggedIn, runBothModes } from '@cypress/support/utils'
import {
  type CreatedTask,
  checkNumCalls,
  interceptCreate,
  waitForCreate,
} from '@cypress/support/utils/intercepts'
import { setSettings } from '@cypress/support/utils/settings'
import { clickSubmitBtn, fillTaskForm } from '@cypress/support/utils/task-form'
import { checkTaskInTree } from '@cypress/support/utils/task-tree'

import { type FieldConfig, TaskStatus } from '~/shared/schema'

const { TaskForm } = Selectors

describe('Task Creation', () => {
  const rootTask = {
    ...DefaultTask,
    name: 'E2E Root Level Task',
    status: TaskStatus.PINNED,
  } as const satisfies CreatedTask

  beforeEach(() => {
    interceptCreate()

    const loggedIn = isLoggedIn()
    cy.visit(loggedIn ? Routes.HOME : Routes.GUEST)
  })

  runBothModes('create a task, check displays in main tree', () => {
    cy.get(Selectors.CREATE_TASK_BTN).click()
    fillTaskForm(rootTask)
    clickSubmitBtn('Create', () => waitForCreate(rootTask))
    checkTaskInTree(rootTask)
    checkNumCalls({ create: 1 })
  })

  runBothModes(
    'change rank field visibility/required in settings, check form matches the new settings, create task adhering to new settings',
    () => {
      const fieldConfig = {
        priority: { visible: true, required: true },
        ease: { visible: true, required: false },
        enjoyment: { visible: false, required: false },
        time: { visible: true, required: false },
        timeSpent: { visible: false, required: false },
      } as const satisfies FieldConfig

      const newTask = {
        ...rootTask,
        name: 'Field Config Test Task',
        ease: null,
        enjoyment: null,
      } satisfies CreatedTask

      setSettings({ fieldConfig })
      cy.get('@settingsPut.all').should('have.length', isLoggedIn() ? 4 : 0)
      cy.get(Selectors.BACK_BTN).click()

      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(newTask, fieldConfig)
      clickSubmitBtn('Create', () => waitForCreate(newTask))
      checkTaskInTree(newTask)
      checkNumCalls({ create: 1 })
    },
  )

  runBothModes(
    'change time spent field visibility/required in settings, check form matches the new settings, create task adhering to new settings',
    () => {
      const fieldConfig = {
        ...FieldConfigAllFalse,
        timeSpent: { visible: true, required: true },
      } as const satisfies FieldConfig

      const taskAllNull = {
        ...rootTask,
        priority: null,
        ease: null,
        enjoyment: null,
        time: null,
      } satisfies CreatedTask

      setSettings({ fieldConfig })
      cy.get('@settingsPut.all').should('have.length', isLoggedIn() ? 5 : 0)
      cy.get(Selectors.BACK_BTN).click()

      cy.get(Selectors.CREATE_TASK_BTN).click()
      fillTaskForm(taskAllNull, fieldConfig)
      cy.get(TaskForm.MARK_COMPLETED_CHECKBOX).click()
      cy.get(TaskForm.SUBMIT_BTN).should('be.disabled')
      cy.get(TaskForm.TIME_SPENT_INPUT_HOURS).type('1')
      clickSubmitBtn('Create', () =>
        waitForCreate({ ...taskAllNull, status: TaskStatus.COMPLETED }),
      )
      // TODO: check is in completed tree
      checkNumCalls({ create: 1 })
    },
  )
})
