import { DEFAULT_TASK, Selectors } from '@cypress/support/constants'
import { selectOption } from '@cypress/support/utils'
import { Routes } from '@src/client/lib/constants'
import { contract } from '@src/contract'
import type { Task } from '@src/schema/tasks.zod'

const fillTaskForm = ({
  name,
  priority,
  ease,
  enjoyment,
  time,
}: Pick<Task, 'name' | 'priority' | 'ease' | 'enjoyment' | 'time'>) => {
  cy.get(Selectors.TaskForm.SUBMIT_BTN).should('be.disabled')

  cy.get(Selectors.TaskForm.NAME_INPUT).type(name)

  cy.get(Selectors.TaskForm.SUBMIT_BTN).should('be.disabled')

  if (priority !== null) {
    selectOption(Selectors.RankSelect.PRIORITY, priority)
  }

  if (ease !== null) {
    selectOption(Selectors.RankSelect.EASE, ease)
  }

  if (enjoyment !== null) {
    selectOption(Selectors.RankSelect.ENJOYMENT, enjoyment)
  }

  if (time !== null) {
    selectOption(Selectors.RankSelect.TIME, time)
  }
}

const createTaskAndCheckTree = () => {
  cy.get(Selectors.CREATE_TASK_BTN).click()
  fillTaskForm(DEFAULT_TASK)
  cy.get(Selectors.TaskForm.SUBMIT_BTN)
    .should('be.enabled')
    .should('have.text', 'Create')
    .click()
  cy.get(Selectors.TaskCard.CARD)
    .find(Selectors.TaskCard.TITLE)
    .getElementArrayText()
    .should('include', DEFAULT_TASK.name)
}

describe('Create Task', () => {
  describe('Guest Mode', () => {
    beforeEach(() => {
      cy.visit(Routes.GUEST)
    })

    it('creates a task and displays it in the main tree', () => {
      createTaskAndCheckTree()
    })
  })

  describe('Logged In Mode', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
      cy.clearTestUserTasks()
      cy.visit(Routes.HOME)
    })

    it('creates a task and displays it in the main tree, and persists it to the database', () => {
      cy.request('GET', contract.tasks.list.path)
        .its('body')
        .then((tasks: Task[]) =>
          expect(tasks.map((t) => t.name)).to.not.include(DEFAULT_TASK.name),
        )

      cy.intercept('POST', contract.tasks.create.path).as('createTask')

      createTaskAndCheckTree()

      cy.wait('@createTask')
      cy.request('GET', contract.tasks.list.path)
        .its('body')
        .then((tasks: Task[]) =>
          expect(tasks.map((t) => t.name)).to.include(DEFAULT_TASK.name),
        )
    })
  })
})
