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
    getCardTitle(task.name)
      .parent(TaskCard.CARD)
      .within(() => {
        const subtaskCardTitle = getCardTitle(subtask.name)

        if (subtask.subtasks?.length) {
          subtaskCardTitle
            .parent(TaskCard.CARD)
            .find(TaskCard.EXPAND_BTN)
            .click()
          checkSubtasksInCard(subtask)
        }
      })
  })
}

export const checkTaskInTree = (task: TaskTreeNode) => {
  // TODO: check field values
  const cardTitle = getCardTitle(task.name)

  if (task.subtasks?.length) {
    // Expand the parent card to reveal its direct subtasks
    cardTitle.parent(TaskCard.CARD).find(TaskCard.EXPAND_BTN).click()
    checkSubtasksInCard(task)
  }
}
