import './commands'

import installLogsCollector from 'cypress-terminal-report/src/installLogsCollector'

import { isLoggedIn, setUserMode } from './utils'

installLogsCollector()

beforeEach(() => {
  setUserMode(Cypress.env('userMode'))

  const loggedIn = isLoggedIn()
  if (loggedIn) {
    cy.loginAsTestUser()
    cy.clearTestUserTasks()
    cy.resetTestUserSettings()
  } else {
    cy.clearTestUserTasks()
  }
})
