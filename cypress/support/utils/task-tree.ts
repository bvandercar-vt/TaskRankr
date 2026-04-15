import type { Task } from '~/shared/schema'
import { Selectors } from '../constants'

const { TaskCard } = Selectors

type TaskTreeNode = Pick<Task, 'name'> & { subtasks?: TaskTreeNode[] }

const checkTitleAndSubtasks = (task: TaskTreeNode) => {
  const thisCard = () =>
    cy
      .contains(
        `${TaskCard.CARD} ${TaskCard.TITLE}`,
        new RegExp(`^${task.name}$`),
      )
      .should('exist')
      .closest(TaskCard.CARD)

  const outerCard = thisCard().should('exist')

  if (!task.subtasks?.length) return

  outerCard
    .find(TaskCard.EXPAND_BTN)
    .first()
    .then(($btn) => cy.wrap($btn).click())
  thisCard().within(() => checkSubtasksInCard(task))
}

const checkSubtasksInCard = (task: TaskTreeNode) => {
  task.subtasks?.forEach((subtask) => {
    checkTitleAndSubtasks(subtask)
  })
}

export const checkTaskInTree = checkTitleAndSubtasks
