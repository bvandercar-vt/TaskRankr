/**
 * @fileoverview Completed tasks view page.
 */

import { useMemo, useState } from 'react'
import { CheckCircle2, Search } from 'lucide-react'

import { HowToUseBanner } from '@/components/HowToUseBanner'
import { MainDropdownMenu } from '@/components/MainDropdownMenu'
import { EmptyState, PageError, PageLoading } from '@/components/PageStates'
import { Input } from '@/components/primitives/forms/Input'
import { TaskCard } from '@/components/TaskCard'
import { useGuestModeState } from '@/hooks/useGuestModeState'
import { useTasks } from '@/hooks/useTasks'
import { IconSizeStyle } from '@/lib/constants'
import { RANK_FIELDS_COLUMNS } from '@/lib/sort-tasks'
import { cn } from '@/lib/utils'
import { TaskStatus, type TaskWithSubtasks } from '~/shared/schema'

const Completed = () => {
  const { data: tasks, isLoading, error } = useTasks()
  const { isGuestMode, exitGuestMode } = useGuestModeState()
  const [search, setSearch] = useState('')
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)

  const completedTasks = useMemo(() => {
    if (!tasks) return []

    // Find root-level completed tasks (no parent)
    const completedRoots = tasks.filter(
      (task) => task.status === TaskStatus.COMPLETED && !task.parentId,
    )

    // Build subtask tree for each completed root
    const buildSubtaskTree = (parentId: number): TaskWithSubtasks[] => {
      const children = tasks.filter((t) => t.parentId === parentId)
      return children.map((child) => ({
        ...child,
        subtasks: buildSubtaskTree(child.id),
      }))
    }

    const roots: TaskWithSubtasks[] = completedRoots.map((task) => ({
      ...task,
      subtasks: buildSubtaskTree(task.id),
    }))

    // Sort by completedAt date (most recent first)
    roots.sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0
      return dateB - dateA
    })

    return roots
  }, [tasks])

  const displayedTasks = useMemo(() => {
    if (!search) return completedTasks
    const term = search.toLowerCase()

    const filterTree = (nodes: TaskWithSubtasks[]): TaskWithSubtasks[] =>
      nodes.reduce((acc: TaskWithSubtasks[], node) => {
        const matches = node.name.toLowerCase().includes(term)
        const filteredSubtasks = filterTree(node.subtasks)
        if (matches || filteredSubtasks.length > 0) {
          acc.push({ ...node, subtasks: filteredSubtasks })
        }
        return acc
      }, [])

    return filterTree(completedTasks)
  }, [completedTasks, search])

  if (isLoading) return <PageLoading />
  if (error) return <PageError />

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <main className="max-w-5xl mx-auto px-2 sm:px-4 py-8">
        <HowToUseBanner />
        <div className="flex items-center justify-between mb-4 pr-2">
          <div className="flex items-center gap-2">
            <MainDropdownMenu
              isGuestMode={isGuestMode}
              exitGuestMode={exitGuestMode}
              onSearchToggle={() => setIsSearchExpanded(!isSearchExpanded)}
              currentPage="completed"
            />

            {isSearchExpanded ? (
              <div className="flex items-center bg-secondary/30 rounded-full border border-white/5 px-4 h-10 w-64">
                <Search
                  className={cn(IconSizeStyle.HW4, 'shrink-0 text-primary')}
                />
                <Input
                  placeholder="Search..."
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-full p-0 ml-3 text-sm placeholder:text-muted-foreground/50"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onBlur={() => !search && setIsSearchExpanded(false)}
                  data-testid="input-search-completed"
                />
              </div>
            ) : (
              <h1 className="text-2xl font-bold tracking-tight">
                Completed Tasks
              </h1>
            )}
          </div>
        </div>

        {displayedTasks.length > 0 && (
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-5 shrink-0" />
            <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-4">
              <div className="flex-1 hidden md:block" />
              <div className="flex items-center gap-1 shrink-0 justify-end md:w-[268px] pr-1.5 md:pr-0">
                {RANK_FIELDS_COLUMNS.map((field) => (
                  <span
                    key={`${field.name}-col-header`}
                    className="text-[10px] font-medium text-muted-foreground uppercase w-16 text-center"
                  >
                    {'labelShort' in field ? field.labelShort : field.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1">
          {displayedTasks.length === 0 ? (
            <EmptyState
              icon={
                search ? (
                  <Search
                    className={cn(IconSizeStyle.HW8, 'text-muted-foreground')}
                  />
                ) : (
                  <CheckCircle2
                    className={cn(IconSizeStyle.HW8, 'text-muted-foreground')}
                  />
                )
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
