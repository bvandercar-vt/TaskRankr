/**
 * @fileoverview Completed tasks view page.
 */

import { useMemo, useState } from 'react'
import { CheckCircle2, Search } from 'lucide-react'

import { EmptyState as EmptyStateBase } from '@/components/PageStates'
import { Icon } from '@/components/primitives/LucideIcon'
import { TaskCard } from '@/components/TaskCard'
import {
  TaskListPageHeader,
  TaskListPageWrapper,
  TaskListTreeLayout,
} from '@/components/TaskListPage'
import { useTasks } from '@/hooks/useTasks'
import { filterAndSortTree, RANK_FIELDS_COLUMNS } from '@/lib/sort-tasks'
import { TaskStatus, type TaskWithSubtasks } from '~/shared/schema'

const ColumnHeaders = () => (
  <div className="flex items-center gap-1 shrink-0 justify-end">
    {RANK_FIELDS_COLUMNS.map((field) => (
      <span
        key={`${field.name}-col-header`}
        className="text-[10px] font-medium text-muted-foreground uppercase w-16 text-center"
      >
        {field.labelShort ?? field.label}
      </span>
    ))}
  </div>
)

const EmptyState = ({ search }: { search: string | undefined }) => (
  <EmptyStateBase
    icon={
      <Icon
        icon={search ? Search : CheckCircle2}
        className="size-8 text-muted-foreground"
      />
    }
    title={search ? 'No matching tasks found' : 'No completed tasks yet'}
    description={
      search
        ? 'Try adjusting your search terms.'
        : 'Long-press on any task to mark it as complete.'
    }
  />
)

const Completed = () => {
  const { data: allTasks, isLoading } = useTasks()
  const [search, setSearch] = useState('')

  const completedTasks = useMemo(() => {
    const buildSubtaskTree = (parentId: number): TaskWithSubtasks[] => {
      const children = allTasks.filter((t) => t.parentId === parentId)
      return children.map((child) => ({
        ...child,
        subtasks: buildSubtaskTree(child.id),
      }))
    }

    const roots: TaskWithSubtasks[] = allTasks
      .filter((task) => task.status === TaskStatus.COMPLETED && !task.parentId)
      .map((task) => ({
        ...task,
        subtasks: buildSubtaskTree(task.id),
      }))

    return roots
  }, [allTasks])

  const displayedTasks = useMemo(
    () => filterAndSortTree(completedTasks, search, ['date_completed']),
    [completedTasks, search],
  )

  return (
    <TaskListPageWrapper isLoading={isLoading}>
      <TaskListPageHeader
        title="Completed Tasks"
        ColumnHeaders={displayedTasks.length > 0 && <ColumnHeaders />}
        searchVal={search}
        setSearchVal={setSearch}
      />

      <TaskListTreeLayout>
        {displayedTasks.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          displayedTasks.map((task) => (
            <TaskCard key={task.id} task={task} showRestore showCompletedDate />
          ))
        )}
      </TaskListTreeLayout>
    </TaskListPageWrapper>
  )
}

export default Completed
