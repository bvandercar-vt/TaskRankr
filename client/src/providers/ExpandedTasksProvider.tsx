/**
 * @fileoverview Provider for task expansion state management.
 */

import {
  ExpandedTasksContext,
  useExpandedTasksState,
} from '@/hooks/useExpandedTasks'

interface ExpandedTasksProviderProps {
  children: React.ReactNode
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
