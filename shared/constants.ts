/**
 * @fileoverview Constants shared between client and server.
 */

/**
 * Shared between the server (which registers the routes) and Cypress (which
 * calls them), so both sides always agree on the path strings.
 *
 * TEST_* paths are E2E-only backdoors, only registered when
 * NODE_ENV !== 'production'. See server/routes.ts → registerTestRoutes.
 */
export const AuthPaths = {
  LOGIN: '/api/login',
  LOGOUT: '/api/logout',
  CALLBACK: '/api/callback',
  USER: '/api/auth/user',
  /** E2E only – creates a real server session without going through Replit OAuth. */
  TEST_LOGIN: '/api/test/login',
  /** E2E only – GET/DELETE the test user's tasks without a session. */
  TEST_TASKS: '/api/test/tasks',
} as const
