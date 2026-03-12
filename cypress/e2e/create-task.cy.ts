import { Selectors } from '@cypress/support/constants'

const TASK_NAME = 'E2E Test Task'

const selectOption = (trigger: string, value: string) => {
  cy.get(trigger).click()
  cy.get('[role="listbox"]').contains(value).click()
}

const createTaskAndCheckTree = () => {
  it('creates a task and displays it in the main tree', () => {
    cy.get(Selectors.CREATE_TASK_BTN).click()
    cy.get(Selectors.TaskForm.NAME_INPUT).type(TASK_NAME)
    cy.get(Selectors.TaskForm.SUBMIT_BTN).contains('Create').click()
    cy.get(Selectors.TaskCard.CARD)
      .find(Selectors.TaskCard.TITLE)
      .should('have.text', TASK_NAME)
  })
}

describe('Create Task', () => {
  describe('Guest Mode', () => {
    beforeEach(() => {
      cy.visit('/')
      cy.get(Selectors.TRY_GUEST_BTN).click()
    })

    createTaskAndCheckTree()
  })

  describe('Logged In Mode', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
      cy.clearTestUserTasks()
      cy.visit('/')
    })

    it('creates a task, displays it in the main tree, and persists it to the database', () => {
      cy.intercept('POST', '/api/tasks').as('createTask')
      cy.get(Selectors.CREATE_TASK_BTN).click()
      cy.get(Selectors.TaskForm.NAME_INPUT).type(TASK_NAME)

      cy.get(Selectors.TaskForm.SUBMIT_BTN).should('be.disabled')

      selectOption(Selectors.RankSelect.PRIORITY, 'medium')
      cy.get(Selectors.TaskForm.SUBMIT_BTN).should('be.disabled')

      selectOption(Selectors.RankSelect.EASE, 'medium')
      cy.get(Selectors.TaskForm.SUBMIT_BTN).should('be.disabled')

      selectOption(Selectors.RankSelect.ENJOYMENT, 'medium')
      cy.get(Selectors.TaskForm.SUBMIT_BTN).should('be.disabled')

      selectOption(Selectors.RankSelect.TIME, 'medium')
      cy.get(Selectors.TaskForm.SUBMIT_BTN).should('not.be.disabled').click()

      cy.get(Selectors.TaskCard.CARD)
        .find(Selectors.TaskCard.TITLE)
        .should('have.text', TASK_NAME)
      cy.wait('@createTask')
      cy.request('GET', '/api/tasks')
        .its('body')
        .then((tasks: Array<{ name: string }>) => {
          expect(tasks.some((t) => t.name === TASK_NAME)).to.be.true
        })
    })
  })
})
