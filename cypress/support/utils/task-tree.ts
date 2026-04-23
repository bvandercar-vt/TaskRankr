import type { Task } from '~/shared/schema'
import { Selectors } from '../constants'

const { TaskCard } = Selectors

type TaskTreeNode = Pick<Task, 'name'> & { subtasks?: TaskTreeNode[] }

export const getTaskCardTitle = (task: Pick<Task, 'name'>) =>
  cy
    .contains(
      `${TaskCard.CARD} ${TaskCard.TITLE}`,
      new RegExp(`^${task.name}$`),
    )
    .should('exist')
    .should('have.length', 1)

const checkTitleAndSubtasks = (task: TaskTreeNode) => {
  const getTaskCard = () => getTaskCardTitle(task).closest(TaskCard.CARD)

  const thisTaskCard = getTaskCard().should('exist')

  if (!task.subtasks?.length) return

  thisTaskCard.then(($card) => {
    const expandBtns = $card.find(TaskCard.EXPAND_BTN)
    if (expandBtns.length > 0) {
      cy.wrap(expandBtns).each(($btn) => cy.wrap($btn).click())
    }
  })

  // expanding changes the render, so we need to get the card again
  getTaskCard().within(() => checkSubtasksInCard(task))
}

const checkSubtasksInCard = (task: TaskTreeNode) => {
  task.subtasks?.forEach((subtask) => {
    checkTitleAndSubtasks(subtask)
  })
}

export const expandAndCheckTree = checkTitleAndSubtasks

export const openTaskEditForm = (task: Pick<Task, 'name'>) => {
  cy.get(Selectors.TaskForm.FORM).should('not.exist')
  getTaskCardTitle(task).click()
  cy.get(Selectors.TaskForm.FORM).should('be.visible')
}
