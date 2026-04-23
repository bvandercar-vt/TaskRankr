import { Selectors } from '../constants'

export const goToCompletedPage = () => {
  cy.get(Selectors.MENU_BTN).click()
  cy.get(Selectors.Menu.COMPLETED).click()
}
