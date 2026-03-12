/**
 * @fileoverview Constants shared between client and server.
 */

export const AuthPaths = {
  LOGIN: '/api/login',
  LOGOUT: '/api/logout',
  CALLBACK: '/api/callback',
  USER: '/api/auth/user',
  TEST_LOGIN: '/api/test/login',
  TEST_TASKS: '/api/test/tasks',
} as const
