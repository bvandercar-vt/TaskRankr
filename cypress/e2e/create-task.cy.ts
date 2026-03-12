import { Selectors } from '@cypress/support/constants/selectors'

const TASK_NAME = 'E2E Test Task - Create'

describe('Create Task', () => {
  describe('Guest Mode', () => {
    beforeEach(() => {
      cy.clearLocalStorage()
      cy.visit('/')
      cy.get(Selectors.TRY_GUEST_BUTTON).click()
    })

    it('creates a task and displays it in the main tree', () => {
      cy.get(Selectors.CREATE_TASK_BUTTON).click()
      cy.get(Selectors.TASK_NAME_INPUT).type(TASK_NAME)
      cy.get(Selectors.SUBMIT_BUTTON).contains('Create').click()
      cy.contains(Selectors.TASK_CARD, TASK_NAME).should('be.visible')
    })
  })

  describe('Logged In Mode', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
      cy.clearTestUserTasks()
      cy.visit('/')
    })

    it('creates a task and displays it in the main tree', () => {
      cy.get(Selectors.CREATE_TASK_BUTTON).click()
      cy.get(Selectors.TASK_NAME_INPUT).type(TASK_NAME)
      cy.get(Selectors.SUBMIT_BUTTON).contains('Create').click()
      cy.contains(Selectors.TASK_CARD, TASK_NAME).should('be.visible')
    })
  })
})
