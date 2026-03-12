export const selectOption = (trigger: string, value: string) => {
  cy.get(trigger).click()
  cy.get('[role="listbox"]').contains(value).click()
}
