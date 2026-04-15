const userMode = (Cypress.env('userMode') as string | undefined)?.toUpperCase()
if (userMode === undefined)
  throw new Error('userMode environment variable is not set')
if (userMode !== 'USER' && userMode !== 'GUEST')
  throw new Error(`Invalid userMode environment variable value: ${userMode}`)

export const isLoggedIn = () => userMode === 'USER'
