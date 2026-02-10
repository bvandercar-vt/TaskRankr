/**
 * @fileoverview Task display card with status indicators, expandable subtasks,
 * and interactions (single click and long press).
 */

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronRight, Pin } from 'lucide-react'

import { ChangeStatusDialog } from '@/components/ChangeStatusDialog'
import { Badge } from '@/components/primitives/Badge'
import { useTaskDialog } from '@/components/providers/TaskFormDialogProvider'
import { useExpandedTasks } from '@/hooks/useExpandedTasks'
import { useSettings } from '@/hooks/useSettings'
import { useTaskActions } from '@/hooks/useTasks'
import { IconSizeStyle } from '@/lib/constants'
import { getRankFieldStyle } from '@/lib/rank-field-styles'
import { RANK_FIELDS_COLUMNS } from '@/lib/sort-tasks'
import { cn } from '@/lib/utils'
import { TaskStatus, type TaskWithSubtasks } from '~/shared/schema'
import { Icon } from './primitives/LucideIcon'

interface TaskBadgeProps {
  value: string
  styleClass: string
  muted?: boolean
}

const TaskBadge = ({ value, styleClass, muted }: TaskBadgeProps) => (
  <Badge
    variant="outline"
    className={cn(
      'px-1 py-0 border text-[8px] font-bold uppercase w-16 justify-center shrink-0',
      muted
        ? 'text-muted-foreground/50 bg-transparent border-muted/30'
        : styleClass,
    )}
    data-testid={`badge-${value}`}
  >
    {value}
  </Badge>
)

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

const getTotalAccumulatedTime = (
  task: Pick<
    TaskWithSubtasks,
    'inProgressTime' | 'inProgressStartedAt' | 'status' | 'subtasks'
  >,
): number => {
  let total = task.inProgressTime
  if (task.status === TaskStatus.IN_PROGRESS && task.inProgressStartedAt) {
    const elapsed = Date.now() - task.inProgressStartedAt.getTime()
    total += elapsed
  }

  for (const subtask of task.subtasks) {
    total += getTotalAccumulatedTime(subtask)
  }
  return total
}

const CompletedTimeDisplay = ({
  completedAt,
}: Pick<TaskWithSubtasks, 'completedAt'>) =>
  completedAt && (
    <span className="text-[10px] text-muted-foreground">
      Completed:{' '}
      {completedAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}
    </span>
  )

const InProgressTimeDisplay = (
  task: Parameters<typeof getTotalAccumulatedTime>[0],
) => {
  const { settings } = useSettings()
  const totalTime = getTotalAccumulatedTime(task)

  if (!settings.enableInProgressTime || totalTime <= 0) return null

  return (
    <span className="text-[10px] text-muted-foreground">
      Time spent: {formatDuration(totalTime)}
    </span>
  )
}

interface TaskCardProps {
  task: TaskWithSubtasks
  level?: number
  showRestore?: boolean
  showCompletedDate?: boolean
}

export const TaskCard = ({
  task,
  level = 0,
  showRestore = false,
  showCompletedDate = false,
}: TaskCardProps) => {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isHolding, setIsHolding] = useState(false)
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { setTaskStatus, deleteTask, updateTask } = useTaskActions()
  const { settings } = useSettings()
  const { openEditDialog } = useTaskDialog()
  const { isExpanded: checkExpanded, toggleExpanded } = useExpandedTasks()

  const hasSubtasks = task.subtasks.length > 0
  const isExpanded = checkExpanded(task.id)
  const isInProgress = task.status === TaskStatus.IN_PROGRESS
  const isPinned = task.status === TaskStatus.PINNED
  const isCompleted = task.status === TaskStatus.COMPLETED
  const isNestedWithStatus = level > 0 && (isInProgress || isPinned)
  const isNestedCompleted = level > 0 && isCompleted

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
    setTaskStatus(task.id, status)
    setShowConfirm(false)
  }

  return (
    <div className="group relative">
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative flex items-center gap-2 pr-2 pl-1 py-1 rounded-lg border transition-all duration-200 select-none cursor-pointer',
          isNestedWithStatus
            ? 'border-transparent hover:bg-white/[0.02] hover:border-white/[0.05]'
            : isInProgress
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
        <div className="w-5 flex justify-center shrink-0 self-stretch">
          {hasSubtasks ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(task.id)
              }}
              className="group/expand flex items-center justify-center w-full rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              type="button"
              data-testid={`button-expand-${task.id}`}
            >
              <Icon
                icon={isExpanded ? ChevronDown : ChevronRight}
                className="w-3.5 h-3.5 text-muted-foreground"
              />
            </button>
          ) : (
            <div className="w-3.5" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-4">
          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
            <h3
              className={cn(
                'font-semibold truncate text-base',
                isNestedCompleted
                  ? 'text-muted-foreground line-through'
                  : 'text-foreground',
              )}
            >
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
                className={cn(
                  IconSizeStyle.HW4,
                  'text-slate-400 shrink-0 rotate-45 cursor-pointer',
                )}
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
              {RANK_FIELDS_COLUMNS.map(({ name: field }) => {
                if (!settings.fieldConfig[field].visible) return null
                const value = task[field]
                return (
                  <TaskBadge
                    key={field}
                    value={value ?? ''}
                    styleClass={getRankFieldStyle(field, value, 'opacity-0')}
                    muted={isNestedCompleted}
                  />
                )
              })}
            </div>
            {showCompletedDate && (
              <div className="flex flex-col items-end mt-0.5">
                <CompletedTimeDisplay {...task} />
                <InProgressTimeDisplay {...task} />
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
              {task.subtasks.map((subtask) => (
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
        inProgressTime={getTotalAccumulatedTime(task)}
        onSetStatus={handleSetStatus}
        onUpdateTime={(timeMs) => {
          updateTask({ id: task.id, inProgressTime: timeMs })
        }}
        onDelete={() => deleteTask(task.id)}
      />
    </div>
  )
}
