import './commands'

import installLogsCollector from 'cypress-terminal-report/src/installLogsCollector'

import { isLoggedIn, setUserMode } from './utils'

installLogsCollector()

setUserMode(Cypress.env('userMode'))

beforeEach(() => {
  const loggedIn = isLoggedIn()
  if (loggedIn) {
    cy.loginAsTestUser()
    cy.clearTestUserTasks()
    cy.resetTestUserSettings()
  } else {
    cy.clearTestUserTasks()
  }
})
