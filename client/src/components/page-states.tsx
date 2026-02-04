/**
 * @fileoverview Shared UI components for page loading, error, and empty states
 *
 * Provides reusable components for common page states: PageLoading for
 * loading indicators, PageError for error messages, and EmptyState for
 * empty content with customizable icon, title, and action.
 */

import type { ReactNode } from 'react'

export const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-secondary/50" />
      <div className="h-4 w-32 bg-secondary/50 rounded" />
    </div>
  </div>
)

export const PageError = ({
  message = 'Error loading tasks. Please try again.',
}: {
  message?: string
}) => (
  <div className="min-h-screen flex items-center justify-center text-destructive">
    {message}
  </div>
)

export const EmptyState = ({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) => (
  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
    <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-2">
      {icon}
    </div>
    <h3 className="text-xl font-medium text-foreground">{title}</h3>
    <p className="text-muted-foreground max-w-sm">{description}</p>
    {action}
  </div>
)
