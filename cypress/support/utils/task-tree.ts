import type { Task } from '~/shared/schema'
import { Selectors } from '../constants'

const { TaskCard } = Selectors

type TaskTreeNode = Pick<Task, 'name'> & { subtasks?: TaskTreeNode[] }

export const getTaskCard = (task: Pick<Task, 'name'>) =>
  cy
    .contains(
      `${TaskCard.CARD} ${TaskCard.TITLE}`,
      new RegExp(`^${task.name}$`),
    )
    .should('exist')
    .should('have.length', 1)
    .closest(TaskCard.CARD)

const checkTitleAndSubtasks = (task: TaskTreeNode) => {
  const thisTaskCard = getTaskCard(task).should('exist')

  if (!task.subtasks?.length) return

  thisTaskCard
    .find(TaskCard.EXPAND_BTN)
    .first()
    .then(($btn) => cy.wrap($btn).click())
  // expanding changes the render, so we need to get the card again
  getTaskCard(task).within(() => checkSubtasksInCard(task))
}

const checkSubtasksInCard = (task: TaskTreeNode) => {
  task.subtasks?.forEach((subtask) => {
    checkTitleAndSubtasks(subtask)
  })
}

export const checkTaskInTree = checkTitleAndSubtasks
