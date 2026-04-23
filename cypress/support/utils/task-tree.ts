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
    .should('have.length', 1)
    .scrollIntoView()
    .should('be.visible')

const checkTitleAndSubtasks = (task: TaskTreeNode, tier: number) => {
  cy.wait(300) // TODO: debug
  const taskCard = getTaskCardTitle(task)
    .should(
      tier > 0 && task.status === TaskStatus.COMPLETED
        ? 'have.class'
        : 'not.have.class',
      'line-through',
    )
    .closest(TaskCard.CARD)

  if (!task.subtasks?.length) return

  taskCard
    .then(($card) => {
      const expandBtn = $card.find(TaskCard.EXPAND_BTN).first()
      if (expandBtn.length > 0) {
        cy.wrap(expandBtn).click()
      }
      return cy.wrap($card)
    })
    .within(() => {
      checkSubtasksInCard(task, tier + 1)
    })
}

const checkSubtasksInCard = (task: TaskTreeNode, tier: number) => {
  task.subtasks?.forEach((subtask) => {
    checkTitleAndSubtasks(subtask, tier)
  })
}

export const expandAndCheckTree = (task: TaskTreeNode) => {
  cy.wait(300) // TODO: debug
  checkTitleAndSubtasks(task, 0)
}

export const openTaskEditForm = (task: Pick<Task, 'name'>) => {
  cy.get(Selectors.TaskForm.FORM).should('not.exist')
  cy.wait(300) // TODO: debug
  getTaskCardTitle(task).click()
  cy.get(Selectors.TaskForm.FORM).should('be.visible')
}

export const openStatusChangeDialog = (task: Pick<Task, 'name'>) => {
  cy.wait(300) // TODO: debug
  const title = getTaskCardTitle(task)
  cy.clock()
  title.trigger('mousedown')
  cy.tick(900)
  cy.get(Selectors.ChangeStatusDialog.DIALOG).should('be.visible')
  cy.clock().invoke('restore')
}

export const changeStatusViaStatusChangeDialog = (
  task: Omit<CreatedTask, 'status'>,
  newStatus: TaskStatus.COMPLETED,
) => {
  openStatusChangeDialog(task)
  cy.get(Selectors.ChangeStatusDialog.COMPLETE_BTN).click()
  waitForUpdate({ ...task, status: newStatus })
  cy.get(Selectors.ChangeStatusDialog.DIALOG).should('not.exist')
}
