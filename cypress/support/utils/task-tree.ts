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
  cy.wait(50) // flakes without this. probably due to animation. If problem occurs on subtasks, try basing time on # of subtasks
  getTaskCardTitle(task)
    .should(
      tier > 0 && task.status === TaskStatus.COMPLETED
        ? 'have.class'
        : 'not.have.class',
      'line-through',
    )
    .closest(TaskCard.CARD)
    .as('taskCard')

  if (!task.subtasks?.length) return

  cy.get('@taskCard').then(($card) => {
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
  cy.get('@taskCard').within(() => {
    checkSubtasksInCard(task, tier + 1)
  })
}

const checkSubtasksInCard = (task: TaskTreeNode, tier: number) => {
  task.subtasks?.forEach((subtask) => {
    checkTitleAndSubtasks(subtask, tier)
  })
}

export const expandAndCheckTree = (task: TaskTreeNode) =>
  checkTitleAndSubtasks(task, 0)

export const openTaskEditForm = (task: Pick<Task, 'name'>) => {
  cy.get(Selectors.TaskForm.FORM).should('not.exist')
  getTaskCardTitle(task).click()
  cy.get(Selectors.TaskForm.FORM).should('be.visible')
}

export const openStatusChangeDialog = (task: Pick<Task, 'name'>) => {
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
  waitForUpdate([{ ...task, status: newStatus }])
  cy.get(Selectors.ChangeStatusDialog.DIALOG).should('not.exist')
}
