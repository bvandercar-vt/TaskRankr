/**
 * @fileoverview Authentication utility functions. Handles 401 errors and login
 * redirects.
 */

import { authPaths } from '~/shared/constants'

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
