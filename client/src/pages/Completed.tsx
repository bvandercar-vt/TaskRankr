/**
 * @fileoverview Completed tasks view page.
 */

import { useMemo, useState } from 'react'
import { CheckCircle2, Search } from 'lucide-react'

import { DropdownMenuHeader } from '@/components/DropdownMenuHeader'
import { HowToUseBanner } from '@/components/HowToUseBanner'
import { EmptyState, PageError, PageLoading } from '@/components/PageStates'
import { Icon } from '@/components/primitives/LucideIcon'
import { TaskCard } from '@/components/TaskCard'
import { useTasks } from '@/hooks/useTasks'
import { IconSizeStyle } from '@/lib/constants'
import { filterAndSortTree, RANK_FIELDS_COLUMNS } from '@/lib/sort-tasks'
import { cn } from '@/lib/utils'
import { TaskStatus, type TaskWithSubtasks } from '~/shared/schema'

const Completed = () => {
  const { data: allTasks, isLoading, error } = useTasks()
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

  if (isLoading) return <PageLoading />
  if (error) return <PageError />

  const ColumnHeaders = displayedTasks.length > 0 && (
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

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <main className="max-w-5xl mx-auto px-2 sm:px-4 py-5">
        <HowToUseBanner />

        <h1 className="text-2xl font-bold tracking-tight mb-2 px-2">
          Completed Tasks
        </h1>

        <DropdownMenuHeader search={search} onSearchChange={setSearch}>
          {ColumnHeaders}
        </DropdownMenuHeader>

        <div className="space-y-1">
          {displayedTasks.length === 0 ? (
            <EmptyState
              icon={
                <Icon
                  icon={search ? Search : CheckCircle2}
                  className={cn(IconSizeStyle.HW8, 'text-muted-foreground')}
                />
              }
              title={
                search ? 'No matching tasks found' : 'No completed tasks yet'
              }
              description={
                search
                  ? 'Try adjusting your search terms.'
                  : 'Long-press on any task to mark it as complete.'
              }
            />
          ) : (
            displayedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                showRestore
                showCompletedDate
              />
            ))
          )}
        </div>
      </main>
    </div>
  )
}

export default Completed
