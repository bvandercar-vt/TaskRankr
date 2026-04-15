import type { Task } from '~/shared/schema'
import { Selectors } from '../constants'

const { TaskCard } = Selectors

type TaskTreeNode = Pick<Task, 'name'> & { subtasks?: TaskTreeNode[] }

/**
 * Given a parent task name, expands it and recursively asserts each child
 * subtask is rendered inside it. Uses fresh cy.contains() queries each
 * iteration to avoid Cypress chainable subject drift in forEach loops.
 */
const checkSubtasksInCard = (
  task:TaskTreeNode
) => {
  task.subtasks?.forEach((subtask) => {
    cy.contains(TaskCard.CARD, task.name).within(() => {
      cy.contains(
        `${TaskCard.CARD} ${TaskCard.TITLE}`,
        new RegExp(`^${subtask.name}$`),
      ).should('exist')
    })

    if (subtask.subtasks?.length) {
      cy.contains(TaskCard.CARD, task.name)
        .contains(TaskCard.CARD, subtask.name)
        .find(TaskCard.EXPAND_BTN)
        .click()
      checkSubtasksInCard(subtask)
    }
  })
}

export const checkTaskInTree = (task: TaskTreeNode) => {
  // TODO: check field values
  cy.get(TaskCard.CARD)
    .find(TaskCard.TITLE)
    .first()
    .should('have.text', task.name)

  if (task.subtasks?.length) {
    // Expand the parent card to reveal its direct subtasks
    cy.contains(TaskCard.CARD, task.name).find(TaskCard.EXPAND_BTN).click()

    checkSubtasksInCard(task)
  }
}
