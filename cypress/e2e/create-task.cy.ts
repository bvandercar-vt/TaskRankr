import { Selectors } from '@cypress/support/constants'

const TASK_NAME = 'E2E Test Task'

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

    createTaskAndCheckTree()
  })
})
