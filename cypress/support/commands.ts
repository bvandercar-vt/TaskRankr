import { AuthPaths } from '~/shared/constants'
import { getElementArrayText } from './utils'

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Logs in as the hardcoded test user via POST /api/test/login, which
       * writes a real session cookie without going through Replit OAuth.
       */
      loginAsTestUser(): Chainable<void>

      /** Deletes all tasks for the test user. Call in beforeEach for a clean slate. */
      clearTestUserTasks(): Chainable<void>

      /** Maps a jQuery element collection to an array of their text content. */
      getElementArrayText(): Chainable<(string | null)[]>
    }
  }
}

Cypress.Commands.add('loginAsTestUser', () => {
  cy.request('POST', AuthPaths.TEST_LOGIN).its('status').should('eq', 200)
})

Cypress.Commands.add('clearTestUserTasks', () => {
  cy.request('DELETE', AuthPaths.TEST_TASKS).its('status').should('eq', 200)
})

Cypress.Commands.addQuery(
  'getElementArrayText',
  () => (subject: JQuery<HTMLElement>) => getElementArrayText(subject),
)
