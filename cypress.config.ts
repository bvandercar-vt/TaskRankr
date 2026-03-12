import { defineConfig } from 'cypress'
import vitePreprocessor from 'cypress-vite'

export default defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  fixturesFolder: false,
  e2e: {
    baseUrl: 'http://localhost:5000',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    setupNodeEvents(on) {
      on('file:preprocessor', vitePreprocessor())
    },
  },
})
