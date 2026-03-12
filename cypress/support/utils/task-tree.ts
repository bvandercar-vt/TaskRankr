import type { Task } from '~/shared/schema'
import { Selectors } from '../constants'

const { TaskCard } = Selectors

export const checkTaskInTree = (task: Pick<Task, 'name'>) =>
  // TODO: check field values
  cy
    .get(TaskCard.CARD)
    .find(TaskCard.TITLE)
    .getElementArrayText()
    .should('include', task.name)
