/**
 * @fileoverview Constants shared between client and server.
 */

export const authPaths = {
  login: '/api/login',
  logout: '/api/logout',
  callback: '/api/callback',
  user: '/api/auth/user',
} as const
