import type { Task } from '~/shared/schema'
import { Selectors } from '../constants'

const { TaskCard } = Selectors

type TaskTreeNode = Pick<Task, 'name'> & { subtasks?: TaskTreeNode[] }

/**
 * Given a Cypress chainable representing a parent task card element, expands it
 * and recursively asserts each child subtask is rendered inside it.
 */
const checkSubtasksInCard = (
  parentCard: Cypress.Chainable<JQuery<HTMLElement>>,
  subtasks: TaskTreeNode[],
) => {
  subtasks.forEach((subtask) => {
    // The subtask card is nested inside the parent card in the DOM
    const subtaskCard = parentCard
      .contains(
        `${TaskCard.CARD} ${TaskCard.TITLE}`,
        new RegExp(`^${subtask.name}$`),
      )
      .should('exist')

    if (subtask.subtasks?.length) {
      subtaskCard.find(TaskCard.EXPAND_BTN).click()
      checkSubtasksInCard(subtaskCard, subtask.subtasks)
    }
  })
}

export const checkTaskInTree = (task: TaskTreeNode) => {
  // TODO: check field values
  cy.get(TaskCard.CARD)
    .find(TaskCard.TITLE)
    .getElementArrayText()
    .should('include', task.name)

  if (task.subtasks?.length) {
    // Expand the parent card to reveal its direct subtasks
    cy.contains(TaskCard.CARD, task.name).find(TaskCard.EXPAND_BTN).click()

    checkSubtasksInCard(cy.contains(TaskCard.CARD, task.name), task.subtasks)
  }
}
