import { AuthPaths } from '~/shared/constants'
import { getElementArrayText } from './utils'

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Authenticates as the hardcoded Cypress test user by posting to the
       * test-only login endpoint (POST /api/test/login). That endpoint upserts
       * the test user record and calls Passport's req.login(), producing a
       * real, encrypted session cookie using the same middleware that the
       * production Replit OAuth flow uses.
       *
       * Cypress automatically attaches the returned Set-Cookie header to all
       * subsequent cy.visit() and cy.request() calls within the same test,
       * so route handlers see a fully authenticated session with no browser
       * interaction required.
       */
      loginAsTestUser(): Chainable<void>

      /**
       * Clears all tasks belonging to the test user via DELETE /api/test/tasks.
       * Call this in beforeEach() to guarantee a clean slate between runs,
       * regardless of whether a previous test or CI run left data behind.
       */
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
