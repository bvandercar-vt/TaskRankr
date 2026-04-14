export const runBothModes = (
  testTitle: string,
  runTest: (loggedIn: boolean) => void,
) => {
  describe(testTitle, () => {
    for (const [loggedIn, testTitleSuffix] of [
      [false, 'Guest Mode'],
      [true, 'Logged In Mode'],
    ] as const) {
      it(
        `${testTitle} - ${testTitleSuffix}`,
        setLoggedIn(loggedIn),
        async () => {
          await runTest(loggedIn)
        },
      )
    }
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
