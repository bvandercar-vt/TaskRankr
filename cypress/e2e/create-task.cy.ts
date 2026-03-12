import { Routes } from '@client/lib/constants'
import { ApiPaths, DefaultTask, Selectors } from '@cypress/support/constants'
import { getTasks, selectOption } from '@cypress/support/utils'

import type { Task } from '~/shared/schema'

const { TaskForm, TaskCard } = Selectors
const { RankSelect } = TaskForm

const fillTaskForm = ({
  name,
  priority,
  ease,
  enjoyment,
  time,
}: Pick<Task, 'name' | 'priority' | 'ease' | 'enjoyment' | 'time'>) => {
  cy.get(TaskForm.SUBMIT_BTN).should('be.disabled')

  cy.get(TaskForm.NAME_INPUT).type(name)

  cy.get(TaskForm.SUBMIT_BTN).should('be.disabled')
  if (priority !== null) {
    selectOption(RankSelect.PRIORITY, priority)
  }

  if (ease !== null) {
    selectOption(RankSelect.EASE, ease)
  }

  if (enjoyment !== null) {
    selectOption(RankSelect.ENJOYMENT, enjoyment)
  }

  if (time !== null) {
    selectOption(RankSelect.TIME, time)
  }
}

const createTaskAndCheckTree = () => {
  cy.get(Selectors.CREATE_TASK_BTN).click()
  fillTaskForm(DefaultTask)
  cy.get(TaskForm.SUBMIT_BTN)
    .should('be.enabled')
    .should('have.text', 'Create')
    .click()
  cy.get(TaskCard.CARD)
    .find(TaskCard.TITLE)
    .getElementArrayText()
    .should('include', DefaultTask.name)
}

describe('Create Task', () => {
  describe('Guest Mode', () => {
    beforeEach(() => {
      cy.visit(Routes.GUEST)
    })

    it('creates a task and displays it in the main tree', () => {
      createTaskAndCheckTree()

      getTasks().then((tasks: Task[]) =>
        expect(tasks.map((t) => t.name)).to.include(DefaultTask.name),
      )
    })
  })

  describe('Logged In Mode', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
      cy.clearTestUserTasks()
      cy.visit(Routes.HOME)
    })

    it('creates a task and displays it in the main tree, and persists it to the database', () => {
      getTasks().then((tasks: Task[]) =>
        expect(tasks.map((t) => t.name)).to.not.include(DefaultTask.name),
      )

      cy.intercept('POST', ApiPaths.CREATE_TASK).as('createTask')

      createTaskAndCheckTree()

      cy.wait('@createTask')
      getTasks().then((tasks: Task[]) =>
        expect(tasks.map((t) => t.name)).to.include(DefaultTask.name),
      )
    })
  })
})
