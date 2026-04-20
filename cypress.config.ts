import { defineConfig } from 'cypress'
import installTerminalReporter from 'cypress-terminal-report/src/installLogsPrinter'
import vitePreprocessor from 'cypress-vite'

export default defineConfig({
  video: true,
  screenshotOnRunFailure: true,
  fixturesFolder: false,
  e2e: {
    baseUrl: 'http://localhost:5000',
    specPattern: [
      'cypress/e2e/create-task.cy.ts',
      'cypress/e2e/create-subtasks.cy.ts',
      'cypress/e2e/assign-subtasks.cy.ts',
      // 'cypress/e2e/cancel-task-form.cy.ts',
    ],
    setupNodeEvents(on) {
      on('file:preprocessor', vitePreprocessor())

      installTerminalReporter(on, {
        outputVerbose: false,
        compactLogs: 15,
        outputCompactLogs: false, // print all logs to file
        routeTrimLength: 1000, // don't print all GET data
        printLogsToConsole: 'onFail',
        printLogsToFile: 'always',
        outputRoot: 'cypress/results',
        specRoot: 'cypress/e2e',
        outputTarget: { 'logs|html': 'html' },
      })
    },
  },
})
