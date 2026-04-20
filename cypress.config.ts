import { existsSync, mkdirSync, rmSync } from 'fs'
import path from 'path'
import { defineConfig } from 'cypress'
import installTerminalReporter from 'cypress-terminal-report/src/installLogsPrinter'
import vitePreprocessor from 'cypress-vite'

import { setUserMode } from './cypress/support/utils/test-runner'

const processResultsDir = (resultsDir: string) =>
  process.cwd().endsWith('cypress') && resultsDir.startsWith('cypress')
    ? path.relative('cypress', resultsDir)
    : resultsDir

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
    setupNodeEvents(on, config) {
      config.env.userMode = config.env.userMode?.toUpperCase()
      setUserMode(config.env.userMode)
      const resultsDirRaw = `cypress/results/${config.env.userMode}`
      config.screenshotsFolder = `${resultsDirRaw}/screenshots`
      config.videosFolder = `${resultsDirRaw}/videos`
      const resultsDir = processResultsDir(resultsDirRaw)

      // delete previous run folders
      if (config.trashAssetsBeforeRuns && existsSync(resultsDir)) {
        console.log(`Clearing previous test run folder ${resultsDir}`)
        rmSync(resultsDir, { recursive: true, force: true })
        mkdirSync(resultsDir, { recursive: true })
      }

      on('file:preprocessor', vitePreprocessor())

      installTerminalReporter(on, {
        outputVerbose: false,
        compactLogs: 15,
        outputCompactLogs: false, // print all logs to file
        routeTrimLength: 1000, // don't print all GET data
        printLogsToConsole: 'onFail',
        printLogsToFile: 'always',
        outputRoot: resultsDir,
        specRoot: 'cypress/tests',
        outputTarget: { 'logs|html': 'html' },
      })
    },
  },
})
