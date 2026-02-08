/**
 * @fileoverview Completed tasks view page.
 */

import { useMemo } from 'react'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Link } from 'wouter'

import { EmptyState, PageError, PageLoading } from '@/components/PageStates'
import { Button } from '@/components/primitives/Button'
import { TaskCard } from '@/components/TaskCard'
import { useTasks } from '@/hooks/useTasks'
import { IconSizeStyle } from '@/lib/constants'
import {
  RANK_FIELDS_CRITERIA,
  TaskStatus,
  type TaskWithSubtasks,
} from '~/shared/schema'

const Completed = () => {
  const { data: tasks, isLoading, error } = useTasks()

  // Build tree for completed ROOT tasks only (with all their subtasks)
  // Completed subtasks stay under their parent in the Home page
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

  if (isLoading) return <PageLoading />
  if (error) return <PageError />

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <main className="max-w-5xl mx-auto px-2 sm:px-4 py-8">
        <div className="flex items-center gap-4 mb-8 px-2">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              data-testid="button-back-home"
            >
              <ArrowLeft className={IconSizeStyle.HW5} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Completed Tasks</h1>
        </div>

        {completedTasks.length > 0 && (
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-5 shrink-0" />
            <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-4">
              <div className="flex-1 hidden md:block" />
              <div className="flex items-center gap-1 shrink-0 justify-end md:w-[268px] pr-1.5 md:pr-0">
                {RANK_FIELDS_CRITERIA.map((field) => (
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
          {completedTasks.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="w-8 h-8 text-muted-foreground" />}
              title="No completed tasks yet"
              description="Long-press on any task to mark it as complete."
            />
          ) : (
            completedTasks.map((task) => (
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
