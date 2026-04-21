/**
 * @fileoverview Provider for task expansion state management.
 */

import type { EmptyObject } from 'type-fest'

import {
  ExpandedTasksContext,
  useExpandedTasksState,
} from '@/hooks/useExpandedTasks'

type ExpandedTasksProviderProps = React.PropsWithChildren<EmptyObject>

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
