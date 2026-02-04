/**
 * @fileoverview Authentication utility functions
 * 
 * Provides helper functions for handling authentication errors and redirects,
 * including detection of 401 unauthorized errors and redirecting users
 * to the login page with optional toast notifications.
 */

import { authPaths } from '~/shared/routes'

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message)
}

export function redirectToLogin(
  toast?: (options: {
    title: string
    description: string
    variant: string
  }) => void,
) {
  if (toast) {
    toast({
      title: 'Unauthorized',
      description: 'You are logged out. Logging in again...',
      variant: 'destructive',
    })
  }
  setTimeout(() => {
    window.location.href = authPaths.login
  }, 500)
}
