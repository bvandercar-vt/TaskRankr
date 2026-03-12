import { Routes } from '@client/lib/constants'
import {
  ApiPaths,
  DefaultTask,
  Selectors,
  SettingsAllVisbileAllRequired,
} from '@cypress/support/constants'
import { getTasks } from '@cypress/support/utils'
import { fillTaskForm } from '@cypress/support/utils/task-form'
import { checkTaskInTree } from '@cypress/support/utils/task-tree'

const createTaskAndCheckTree = () => {
  cy.get(Selectors.CREATE_TASK_BTN).click()

  fillTaskForm(DefaultTask, SettingsAllVisbileAllRequired, 'Create')

  checkTaskInTree(DefaultTask.name)
}

describe('Create Task', () => {
  describe('Guest Mode', () => {
    beforeEach(() => {
      cy.clearTestUserTasks()
      cy.visit(Routes.GUEST)
    })

    it('creates a task and displays it in the main tree', () => {
      createTaskAndCheckTree()

      getTasks().then((tasks) =>
        expect(tasks.map((t) => t.name)).to.not.include(DefaultTask.name),
      )
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
      getTasks().then((tasks) =>
        expect(tasks.map((t) => t.name)).to.not.include(DefaultTask.name),
      )

      cy.intercept('POST', ApiPaths.CREATE_TASK).as('createTask')

      createTaskAndCheckTree()

      cy.wait('@createTask')
      getTasks().then((tasks) =>
        expect(tasks.map((t) => t.name)).to.include(DefaultTask.name),
      )
    })
  })
})
