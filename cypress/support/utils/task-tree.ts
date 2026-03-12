import { Selectors } from '../constants'

const { TaskCard } = Selectors

export const checkTaskInTree = (taskName: string) =>
  cy
    .get(TaskCard.CARD)
    .find(TaskCard.TITLE)
    .getElementArrayText()
    .should('include', taskName)
