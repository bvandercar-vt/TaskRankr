import './commands'
import { isLoggedIn } from './utils'

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
