import { TestPaths } from '~/shared/constants'
import { getElementArrayText } from './utils'

declare global {
  namespace Cypress {
    interface Chainable {
      /** Log in as the hardcoded test user, bypassing Replit OAuth. */
      loginAsTestUser(): Chainable<void>

      /** Deletes all tasks for the test user. */
      clearTestUserTasks(): Chainable<void>

      getElementArrayText(): Chainable<(string | null)[]>
    }
  }
}

Cypress.Commands.add('loginAsTestUser', () => {
  cy.request('POST', TestPaths.TEST_LOGIN).should(
    'have.property',
    'status',
    200,
  )
})

Cypress.Commands.add('clearTestUserTasks', () => {
  cy.request('DELETE', TestPaths.TEST_TASKS).should(
    'have.property',
    'status',
    200,
  )
})

Cypress.Commands.addQuery(
  'getElementArrayText',
  () => (subject: JQuery<HTMLElement>) => getElementArrayText(subject),
)
