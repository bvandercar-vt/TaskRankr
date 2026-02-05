/**
 * @fileoverview Provider for task expansion state management.
 */

import type { ReactNode } from 'react'

import {
  ExpandedTasksContext,
  useExpandedTasksState,
} from '@/hooks/useExpandedTasks'

interface ExpandedTasksProviderProps {
  children: ReactNode
}

export const ExpandedTasksProvider = ({
  children,
}: ExpandedTasksProviderProps) => {
  const state = useExpandedTasksState()

  return (
    <ExpandedTasksContext.Provider value={state}>
      {children}
    </ExpandedTasksContext.Provider>
  )
}
