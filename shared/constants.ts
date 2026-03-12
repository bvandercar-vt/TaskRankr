/**
 * @fileoverview Constants shared between client and server.
 */

/**
 * API route paths for authentication and test utilities.
 *
 * TEST_LOGIN and TEST_TASKS are E2E-only backdoor endpoints registered
 * exclusively when NODE_ENV !== 'production' (see server/routes.ts →
 * registerTestRoutes). They are defined here rather than in a test-only file
 * so that both the server (which registers them) and the Cypress support layer
 * (which calls them via cy.request) share a single source of truth for the
 * path strings.
 */
export const AuthPaths = {
  LOGIN: '/api/login',
  LOGOUT: '/api/logout',
  CALLBACK: '/api/callback',
  USER: '/api/auth/user',
  /** E2E only – establishes a server session without the Replit OAuth flow. */
  TEST_LOGIN: '/api/test/login',
  /** E2E only – GET returns / DELETE clears the hardcoded test user's tasks. */
  TEST_TASKS: '/api/test/tasks',
} as const
