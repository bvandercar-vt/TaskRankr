Cypress.Commands.add('loginAsTestUser', () => {
  cy.request('POST', '/api/test/login').its('status').should('eq', 200)
})

Cypress.Commands.add('clearTestUserTasks', () => {
  cy.request('DELETE', '/api/test/tasks').its('status').should('eq', 200)
})

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsTestUser(): Chainable<void>
      clearTestUserTasks(): Chainable<void>
    }
  }
}
