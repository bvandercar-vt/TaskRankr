export * from './api'

export const getElementArrayText = ($elements: JQuery<HTMLElement>) =>
  $elements.toArray().map(($el) => $el.textContent)

export const selectOption = (trigger: string, value: string) => {
  cy.get(trigger).click()
  cy.get('[role="listbox"]').contains(value).click()
}
