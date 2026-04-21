/**
 * @fileoverview Application-wide constants and configuration values
 */

export const STANDARD_DATE_FORMAT = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
} as const satisfies Intl.DateTimeFormatOptions

export const Routes = {
  HOME: '/',
  GUEST: '/guest',
  SETTINGS: '/settings',
  HOW_TO_USE: '/how-to-use',
  HOW_TO_INSTALL: '/how-to-install',
  COMPLETED: '/completed',
} as const
