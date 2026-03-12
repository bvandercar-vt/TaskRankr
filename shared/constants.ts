/**
 * @fileoverview Constants shared between client and server.
 */

export const AuthPaths = {
  LOGIN: '/api/login',
  LOGOUT: '/api/logout',
  CALLBACK: '/api/callback',
  USER: '/api/auth/user',
} as const

/**
 * E2E-only backdoors, only registered when NODE_ENV !== 'production'.
 * See server/routes.ts → registerTestRoutes.
 */
export const TestPaths = {
  /** Creates a real server session without going through Replit OAuth. */
  TEST_LOGIN: '/api/test/login',
  /** GET/DELETE the test user's tasks without a session. */
  TEST_TASKS: '/api/test/tasks',
}
