import { TestPaths } from '~/shared/constants'
import { getElementArrayText } from './utils'

declare global {
  namespace Cypress {
    interface Chainable {
      /** Log in as the hardcoded test user, bypassing Replit OAuth. */
      loginAsTestUser(): Chainable<void>
      /** Deletes all tasks for the test user. */
      clearTestUserTasks(): Chainable<void>
      /** Resets the test user's settings to their defaults on the server. */
      resetTestUserSettings(): Chainable<void>

      /**
       * Escapes if within a .within() by returning the entire `body` element
       */
      escapeWithin(): Chainable<JQuery<HTMLElement>>
      getElementArrayText(): Chainable<(string | null)[]>
      selectOption(value: string): Chainable<void>
      getCheckedState(): Chainable<boolean>
      toggleState(newState: boolean): Chainable<JQuery<HTMLElement>>
    }
  }
}

Cypress.Commands.add('loginAsTestUser', () => {
  cy.request('POST', TestPaths.TEST_LOGIN) //
    .should('have.property', 'status', 200)
})

Cypress.Commands.add('clearTestUserTasks', () => {
  cy.request('DELETE', TestPaths.TEST_TASKS) //
    .should('have.property', 'status', 200)
})

Cypress.Commands.add('resetTestUserSettings', () => {
  cy.request('DELETE', TestPaths.TEST_RESET_SETTINGS) //
    .should('have.property', 'status', 200)
})

Cypress.Commands.addQuery('escapeWithin', () => () => cy.$$('body'))

Cypress.Commands.addQuery(
  'getElementArrayText',
  () => (subject: JQuery<HTMLElement>) => getElementArrayText(subject),
)

Cypress.Commands.add(
  'selectOption',
  { prevSubject: 'element' },
  (subject, value) => {
    cy.wrap(subject).click()
    cy.escapeWithin()
      .find('[role="listbox"]')
      .contains(new RegExp(`^${value}$`))
      .click()
  },
)

Cypress.Commands.add(
  'getCheckedState',
  { prevSubject: 'element' },
  (subject) => {
    const state = Cypress.$(subject).attr('data-state')
    if (state === 'checked') return cy.wrap(true)
    if (state === 'unchecked') return cy.wrap(false)
    throw new Error('Element does not have a data-state attribute')
  },
)

Cypress.Commands.add(
  'toggleState',
  { prevSubject: 'element' },
  (subject, newState) => {
    cy.wrap(subject).getCheckedState().should('eq', !newState)
    cy.wrap(subject).click()
    cy.wrap(subject).getCheckedState().should('eq', newState)
  },
)
