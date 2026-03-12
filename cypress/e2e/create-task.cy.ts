const TASK_NAME = 'E2E Test Task - Create'

// ─── Helpers ────────────────────────────────────────────────────────────────

function openCreateDialog() {
  cy.get('[data-testid="button-create-task"]').click()
}

function fillAndSubmitTaskForm(taskName: string) {
  cy.get('textarea[placeholder="Task name"]').type(taskName)
  cy.get('button[type="submit"]').contains('Create').click()
}

function createTask(taskName: string) {
  openCreateDialog()
  fillAndSubmitTaskForm(taskName)
}

function verifyTaskInTree(taskName: string) {
  cy.contains('[data-testid^="task-card-"]', taskName).should('be.visible')
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Create Task', () => {
  describe('Guest Mode', () => {
    beforeEach(() => {
      cy.clearLocalStorage()
      cy.visit('/')
      cy.get('[data-testid="button-try-guest"]').click()
    })

    it('creates a task and displays it in the main tree', () => {
      createTask(TASK_NAME)
      verifyTaskInTree(TASK_NAME)
    })
  })

  describe('Logged In Mode', () => {
    beforeEach(() => {
      cy.loginAsTestUser()
      cy.clearTestUserTasks()
      cy.visit('/')
    })

    it('creates a task and displays it in the main tree', () => {
      createTask(TASK_NAME)
      verifyTaskInTree(TASK_NAME)
    })
  })
})
