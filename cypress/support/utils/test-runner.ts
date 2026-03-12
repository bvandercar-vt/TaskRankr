export const runBothModes = (
  testTitle: string,
  runTest: (loggedIn: boolean) => void,
) => {
  describe(testTitle, () => {
    it(`${testTitle} - Guest Mode`, setLoggedIn(false), async () => {
      cy.clearTestUserTasks()

      await runTest(false)
    })

    it(`${testTitle} - Logged In Mode`, setLoggedIn(true), async () => {
      cy.loginAsTestUser()
      cy.clearTestUserTasks()
      cy.resetTestUserSettings()

      await runTest(true)
    })
  })
}

const LOGGED_IN_ENV_VAR = 'LOGGED_IN'
export const setLoggedIn = (loggedIn: boolean) =>
  ({
    env: { [LOGGED_IN_ENV_VAR]: loggedIn ? 'true' : 'false' },
  }) satisfies Pick<Cypress.ResolvedConfigOptions, 'env'>

export const isLoggedIn = () => {
  const val: boolean | undefined = Cypress.env(LOGGED_IN_ENV_VAR)
  if (val === undefined)
    throw new Error(`$${LOGGED_IN_ENV_VAR} environment variable is not set`)
  return val
}
