import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronRight, Pin } from 'lucide-react'

import { ChangeStatusDialog } from '@/components/ChangeStatusDialog'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { Badge } from '@/components/primitives/badge'
import { useTaskDialog } from '@/components/TaskDialogProvider'
import { getSettings } from '@/hooks/use-settings'
import {
  useDeleteTask,
  useSetTaskStatus,
  useUpdateTask,
} from '@/hooks/use-tasks'
import { getAttributeStyle } from '@/lib/task-styles'
import { cn } from '@/lib/utils'
import {
  RANK_FIELDS_CRITERIA,
  type TaskResponse,
  type TaskStatus,
} from '~/shared/schema'

interface TaskBadgeProps {
  value: string
  styleClass: string
}

const TaskBadge = ({ value, styleClass }: TaskBadgeProps) => (
  <Badge
    variant="outline"
    className={cn(
      'px-1 py-0 border text-[8px] font-bold uppercase w-16 justify-center shrink-0',
      styleClass,
    )}
    data-testid={`badge-${value}`}
  >
    {value}
  </Badge>
)

interface TaskCardProps {
  task: TaskResponse
  level?: number
  showRestore?: boolean
  showCompletedDate?: boolean
}

// Format date helper
const formatCompletedDate = (dateValue: Date | string | null | undefined) => {
  if (!dateValue) return null
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Format duration helper (milliseconds to human-readable)
const formatDuration = (ms: number) => {
  if (ms <= 0) return null
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else {
    return `${totalSeconds}s`
  }
}

// Calculate current accumulated time for in-progress tasks
const getCurrentAccumulatedTime = (task: TaskResponse): number => {
  let total = task.inProgressTime
  if (task.status === 'in_progress' && task.inProgressStartedAt) {
    const startedAt =
      typeof task.inProgressStartedAt === 'string'
        ? new Date(task.inProgressStartedAt)
        : task.inProgressStartedAt
    const elapsed = Date.now() - startedAt.getTime()
    total += elapsed
  }
  return total
}

export const TaskCard = ({
  task,
  level = 0,
  showRestore = false,
  showCompletedDate = false,
}: TaskCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isHolding, setIsHolding] = useState(false)
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null)

  const setTaskStatus = useSetTaskStatus()
  const deleteTask = useDeleteTask()
  const updateTask = useUpdateTask()
  const settings = getSettings()
  const { openEditDialog } = useTaskDialog()

  const hasSubtasks = task.subtasks && task.subtasks.length > 0
  const isInProgress = task.status === 'in_progress'
  const isPinned = task.status === 'pinned'

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return

    setIsHolding(true)
    const duration = 800

    holdTimerRef.current = setTimeout(() => {
      setShowConfirm(true)
      setIsHolding(false)
    }, duration)
  }

  const cancelHold = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    setIsHolding(false)
  }

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    }
  }, [])

  const handleSetStatus = (status: TaskStatus) => {
    setTaskStatus.mutate({ id: task.id, status })
    setShowConfirm(false)
  }

  return (
    <div className="group relative">
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative flex items-center gap-2 p-2 rounded-lg border transition-all duration-200 select-none cursor-pointer',
          isInProgress
            ? 'border-blue-500/30 bg-blue-500/5'
            : isPinned
              ? 'border-slate-400/30 bg-slate-500/5'
              : 'border-transparent hover:bg-white/[0.02] hover:border-white/[0.05]',
          isHolding && 'bg-white/[0.05] scale-[0.99] transition-transform',
        )}
        style={{ marginLeft: `${level * 16}px` }}
        data-testid={`task-${task.status}-${task.id}`}
        onClick={() => openEditDialog(task)}
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
      >
        <div className="w-5 flex justify-center shrink-0">
          {hasSubtasks ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              className="p-0.5 hover:bg-white/10 rounded-full transition-colors"
              type="button"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-3.5" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-4">
          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
            <h3 className="font-semibold truncate text-base text-foreground">
              {task.name}
            </h3>
            {isInProgress && (
              // biome-ignore lint/a11y/noStaticElementInteractions: TODO: resolve
              // biome-ignore lint/a11y/useKeyWithClickEvents: TODO: resolve
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  setShowConfirm(true)
                }}
                className="cursor-pointer"
              >
                <TaskBadge
                  value="In Progress"
                  styleClass="text-blue-400 bg-blue-400/10 border-blue-400/20"
                />
              </div>
            )}
            {isPinned && (
              <Pin
                className="w-4 h-4 text-slate-400 shrink-0 rotate-45 cursor-pointer"
                data-testid="icon-pinned"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowConfirm(true)
                }}
              />
            )}
          </div>

          <div className="flex flex-col items-end shrink-0 md:w-[268px] md:pr-0">
            <div className="flex items-center gap-1 justify-end">
              {RANK_FIELDS_CRITERIA.map(({ name: field }) => {
                const visibleKey = `${field}Visible` as const
                if (!settings[visibleKey]) return null
                const value = task[field] ?? 'none'
                return (
                  <TaskBadge
                    key={field}
                    value={value}
                    styleClass={
                      value === 'none'
                        ? 'opacity-0'
                        : getAttributeStyle(field, value)
                    }
                  />
                )
              })}
            </div>
            {showCompletedDate && (
              <div className="flex flex-col items-end mt-0.5">
                {task.completedAt && (
                  <span className="text-[10px] text-muted-foreground">
                    Completed: {formatCompletedDate(task.completedAt)}
                  </span>
                )}
                {settings.enableInProgressTime && task.inProgressTime > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    Time spent: {formatDuration(task.inProgressTime)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && hasSubtasks && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="relative">
              <div
                className="absolute left-[26px] top-0 bottom-3 w-px bg-white/[0.05]"
                style={{ marginLeft: `${level * 16}px` }}
              />
              {task.subtasks?.map((subtask) => (
                <TaskCard
                  key={subtask.id}
                  task={subtask}
                  level={level + 1}
                  showRestore={showRestore}
                  showCompletedDate={showCompletedDate}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChangeStatusDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        taskName={task.name}
        status={task.status}
        inProgressTime={getCurrentAccumulatedTime(task)}
        onSetStatus={handleSetStatus}
        onUpdateTime={(timeMs) => {
          updateTask.mutate({ id: task.id, inProgressTime: timeMs })
        }}
        onDeleteClick={() => {
          setShowConfirm(false)
          setTimeout(() => setShowDeleteConfirm(true), 100)
        }}
      />

      <ConfirmDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        taskName={task.name}
        onConfirm={() => {
          deleteTask.mutate(task.id)
          setShowDeleteConfirm(false)
        }}
      />
    </div>
  )
}
