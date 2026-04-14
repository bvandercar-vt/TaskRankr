import type { TaskWithSubtasks } from '@client/types'
import type { SetOptional } from 'type-fest'

import { Selectors } from '../constants'

const { TaskCard } = Selectors

export const checkTaskInTree = (
  task: SetOptional<Pick<TaskWithSubtasks, 'name' | 'subtasks'>, 'subtasks'>,
) => {
  // TODO: check field values
  cy.get(TaskCard.CARD)
    .find(TaskCard.TITLE)
    .getElementArrayText()
    .should('include', task.name)
  // TODO: check subtasks
}
