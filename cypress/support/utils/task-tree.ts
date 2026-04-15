import type { Task } from '~/shared/schema'
import { Selectors } from '../constants'

const { TaskCard } = Selectors

type TaskTreeNode = Pick<Task, 'name'> & { subtasks?: TaskTreeNode[] }

const getCardTitle = (taskName: string) =>
  cy
    .contains(`${TaskCard.CARD} ${TaskCard.TITLE}`, new RegExp(`^${taskName}$`))
    .should('exist')

/**
 * Given a parent task name, expands it and recursively asserts each child
 * subtask is rendered inside it. Uses fresh cy.contains() queries each
 * iteration to avoid Cypress chainable subject drift in forEach loops.
 */
const checkSubtasksInCard = (task: TaskTreeNode) => {
  task.subtasks?.forEach((subtask) => {
    const subtaskCardTitle = getCardTitle(subtask.name)

    if (subtask.subtasks?.length) {
      const subtaskCard = subtaskCardTitle.closest(TaskCard.CARD)
      subtaskCard.find(TaskCard.EXPAND_BTN).click()
      subtaskCard.within(() => checkSubtasksInCard(subtask))
    }
  })
}

export const checkTaskInTree = (task: TaskTreeNode) => {
  // TODO: check field values
  const cardTitle = getCardTitle(task.name)

  if (task.subtasks?.length) {
    // Expand the parent card to reveal its direct subtasks
    const card = cardTitle.closest(TaskCard.CARD)
    card.find(TaskCard.EXPAND_BTN).click()
    card.within(() => checkSubtasksInCard(task))
  }
}
