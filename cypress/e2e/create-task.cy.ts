import { Routes } from '@client/lib/constants'
import {
  ApiPaths,
  DefaultTask,
  Selectors,
  SettingsAllVisbileAllRequired,
} from '@cypress/support/constants'
import { checkTaskExistsBackend } from '@cypress/support/utils'
import { fillTaskForm } from '@cypress/support/utils/task-form'
import { checkTaskInTree } from '@cypress/support/utils/task-tree'

const createTaskAndCheckTree = () => {
  cy.get(Selectors.CREATE_TASK_BTN).click()

  fillTaskForm(DefaultTask, SettingsAllVisbileAllRequired, 'Create')

  checkTaskInTree(DefaultTask)
}

describe('Create Task', () => {
  describe('Guest Mode', () => {
    beforeEach(() => {
      cy.clearTestUserTasks()
      cy.visit(Routes.GUEST)
    })

    it('creates a task and displays it in the main tree', () => {
      createTaskAndCheckTree()

      checkTaskExistsBackend(DefaultTask, false)
    })
  })

  describe('Logged In Mode', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
      cy.clearTestUserTasks()
      cy.resetTestUserSettings()
      cy.visit(Routes.HOME)
    })

    it('creates a task and displays it in the main tree, and persists it to the database', () => {
      checkTaskExistsBackend(DefaultTask, false)
      cy.intercept('POST', ApiPaths.CREATE_TASK).as('createTask')

      createTaskAndCheckTree()

      cy.wait('@createTask')
      checkTaskExistsBackend(DefaultTask, true)
    })
  })
})
