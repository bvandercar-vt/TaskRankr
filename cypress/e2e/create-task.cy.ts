import { Selectors } from '../support/constants'

const TASK_NAME = 'E2E Test Task - Create'

describe('Create Task', () => {
  describe('Guest Mode', () => {
    beforeEach(() => {
      cy.clearLocalStorage()
      cy.visit('/')
      cy.get(Selectors.tryGuestButton).click()
    })

    it('creates a task and displays it in the main tree', () => {
      cy.get(Selectors.createTaskButton).click()
      cy.get(Selectors.taskNameInput).type(TASK_NAME)
      cy.get(Selectors.submitButton).contains('Create').click()
      cy.contains(Selectors.taskCard, TASK_NAME).should('be.visible')
    })
  })

  describe('Logged In Mode', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
      cy.clearTestUserTasks()
      cy.visit('/')
    })

    it('creates a task and displays it in the main tree', () => {
      cy.get(Selectors.createTaskButton).click()
      cy.get(Selectors.taskNameInput).type(TASK_NAME)
      cy.get(Selectors.submitButton).contains('Create').click()
      cy.contains(Selectors.taskCard, TASK_NAME).should('be.visible')
    })
  })
})
