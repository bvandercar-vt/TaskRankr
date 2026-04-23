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

  const taskCard = getTaskCard()

  if (!task.subtasks?.length) return

  taskCard.then(($card) => {
    const expandBtn = $card.find(TaskCard.EXPAND_BTN).first()
    if (expandBtn.length > 0) {
      cy.log('expanding collapsed card...')
      cy.wrap($card).find(TaskCard.COLLAPSE_BTN).should('not.exist')
      cy.wrap($card).find(TaskCard.CARD).should('not.exist')
      cy.wrap(expandBtn).click()
      cy.wrap($card).find(TaskCard.COLLAPSE_BTN).should('exist')
      cy.wrap($card).find(TaskCard.CARD).should('exist')
      cy.log('...done expanding collapsed card...')
    }
  })

  // re-renders on expand, reduce flake by re-getting
  getTaskCard().within(() => {
    checkSubtasksInCard(task)
  })
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
