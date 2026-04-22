import { type Task, TaskStatus } from '~/shared/schema'
import { Selectors } from '../constants'
import { type CreatedTask, waitForUpdate } from './intercepts'

const { TaskCard } = Selectors

type TaskTreeNode = Pick<Task, 'name' | 'status'> & {
  subtasks?: TaskTreeNode[]
}

export const getTaskCardTitle = (task: Pick<Task, 'name'>) =>
  cy
    .contains(
      `${TaskCard.CARD} ${TaskCard.TITLE}`,
      new RegExp(`^${task.name}$`),
    )
    .should('exist')
    .should('have.length', 1)

const checkTitleAndSubtasks = (task: TaskTreeNode, isSubtask: boolean) => {
  const getTaskCard = () =>
    getTaskCardTitle(task)
      .should(
        isSubtask && task.status === TaskStatus.COMPLETED
          ? 'have.class'
          : 'not.have.class',
        'line-through',
      )
      .closest(TaskCard.CARD)

  const thisTaskCard = getTaskCard().should('exist')

  if (!task.subtasks?.length) return

  thisTaskCard.then(($card) => {
    const expandBtns = $card.find(TaskCard.EXPAND_BTN)
    if (expandBtns.length > 0) {
      cy.wrap(expandBtns).each(($btn) => cy.wrap($btn).click())
    }
  })

  // expanding changes the render, so we need to get the card again
  // TODO: invesigate, can we make it so it doesn't re-render?
  getTaskCard().within(() => checkSubtasksInCard(task))
}

const checkSubtasksInCard = (task: TaskTreeNode) => {
  task.subtasks?.forEach((subtask) => {
    checkTitleAndSubtasks(subtask, true)
  })
}

export const expandAndCheckTree = (task: TaskTreeNode) =>
  checkTitleAndSubtasks(task, false)

export const openTaskEditForm = (task: Pick<Task, 'name'>) => {
  cy.get(Selectors.TaskForm.FORM).should('not.exist')
  getTaskCardTitle(task).click()
  cy.get(Selectors.TaskForm.FORM).should('be.visible')
}

export const openStatusChangeDialog = (task: Pick<Task, 'name'>) => {
  cy.clock()
  getTaskCardTitle(task).trigger('mousedown')
  cy.tick(900)
  cy.get(Selectors.ChangeStatusDialog.DIALOG).should('be.visible')
}

export const changeStatusViaStatusChangeDialog = (
  task: Omit<CreatedTask, 'status'>,
  newStatus: TaskStatus.COMPLETED,
) => {
  openStatusChangeDialog(task)
  cy.get(Selectors.ChangeStatusDialog.COMPLETE_BTN).click()
  waitForUpdate({ ...task, status: newStatus })
}
