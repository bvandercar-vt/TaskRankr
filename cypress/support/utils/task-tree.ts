import type { Task } from '~/shared/schema'
import { Selectors } from '../constants'

const { TaskCard } = Selectors

type TaskTreeNode = Pick<Task, 'name'> & { subtasks?: TaskTreeNode[] }

const checkTitleAndSubtasks = (task: TaskTreeNode) => {
  const cardTitle = () =>
    cy
      .contains(
        `${TaskCard.CARD} ${TaskCard.TITLE}`,
        new RegExp(`^${task.name}$`),
      )
      .should('exist')

  cardTitle().should('exist').closest(TaskCard.CARD).should('exist')

  if (!task.subtasks?.length) return

  cardTitle().closest(TaskCard.CARD).find(TaskCard.EXPAND_BTN).click()
  cardTitle()
    .closest(TaskCard.CARD)
    .find(TaskCard.EXPAND_BTN)
    .should('not.exist')
  cardTitle()
    .closest(TaskCard.CARD)
    .within(() => checkSubtasksInCard(task))
}

const checkSubtasksInCard = (task: TaskTreeNode) => {
  task.subtasks?.forEach((subtask) => {
    checkTitleAndSubtasks(subtask)
  })
}

export const checkTaskInTree = checkTitleAndSubtasks
