import type { Task } from '~/shared/schema'
import { Selectors } from '../constants'

const { TaskCard } = Selectors

type TaskTreeNode = Pick<Task, 'name'> & { subtasks?: TaskTreeNode[] }

export const checkTaskInTree = (task: TaskTreeNode) => {
  // TODO: check field values
  cy.get(TaskCard.CARD)
    .find(TaskCard.TITLE)
    .getElementArrayText()
    .should('include', task.name)
  // TODO: check subtasks
}
