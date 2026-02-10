/**
 * @fileoverview Dialog component for changing task status (i.e. open,
 * in_progress, pinned, completed) as well as updating time spent on tasks,
 * deleting tasks. Adapts available actions based on current task status.
 */

import { useEffect, useState } from 'react'
import {
  Clock,
  type LucideIcon,
  Pin,
  PinOff,
  StopCircle,
  X,
} from 'lucide-react'

import { Button } from '@/components/primitives/Button'
import { TimeInput } from '@/components/primitives/forms/TimeInput'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/primitives/overlays/AlertDialog'
import { useSettings } from '@/hooks/useSettings'
import { IconSize } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { TaskStatus } from '~/shared/schema'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'

const TimeSpentInput = ({
  onBlur,
  localTimeMs,
  setLocalTimeMs,
}: {
  onBlur: () => void
  localTimeMs: number
  setLocalTimeMs: (ms: number) => void
}) => (
  <div className="flex items-center justify-center gap-3 pt-2 border-t border-white/10">
    <span className="text-xs text-muted-foreground">Time Spent</span>
    <TimeInput
      durationMs={localTimeMs}
      onDurationChange={setLocalTimeMs}
      onBlur={onBlur}
      className="w-16 h-8 text-center text-sm bg-secondary/30"
    />
  </div>
)

const DeleteButton = ({
  taskName,
  onConfirm,
}: {
  taskName: string
  onConfirm: () => void
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 h-8"
        onClick={() => {
          setTimeout(() => setShowDeleteConfirm(true), 100)
        }}
        data-testid="button-delete-task"
      >
        <span className="text-xs font-medium">Delete Permanently</span>
      </Button>
      <ConfirmDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        taskName={taskName}
        onConfirm={() => {
          onConfirm()
          setShowDeleteConfirm(false)
        }}
      />
    </>
  )
}

interface ChangeStatusButtonProps {
  icon: LucideIcon
  label: string
  onClick: () => void
  colorClass?: string
  'data-testid': string
}

const ChangeStatusButton = ({
  icon: Icon,
  label,
  onClick,
  colorClass = 'border-slate-400/50 text-slate-400 hover:bg-slate-500/10',
  'data-testid': testId,
}: ChangeStatusButtonProps) => (
  <Button
    onClick={onClick}
    variant="outline"
    className={cn('w-full h-11 text-base font-semibold gap-2', colorClass)}
    data-testid={testId}
  >
    <Icon className={IconSize.HW4} />
    {label}
  </Button>
)

interface ChangeStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskName: string
  status: TaskStatus
  inProgressTime: number
  onSetStatus: (status: TaskStatus) => void
  onUpdateTime: (timeMs: number) => void
  onDelete: () => void
}

export const ChangeStatusDialog = ({
  open,
  onOpenChange,
  taskName,
  status,
  inProgressTime,
  onSetStatus,
  onUpdateTime,
  onDelete,
}: ChangeStatusDialogProps) => {
  const isCompleted = status === TaskStatus.COMPLETED
  const isInProgress = status === TaskStatus.IN_PROGRESS
  const isPinned = status === TaskStatus.PINNED

  const {
    settings: {
      enableInProgressStatus: showInProgressOption,
      enableInProgressTime: showTimeInputs,
    },
  } = useSettings()

  const [localTimeMs, setLocalTimeMs] = useState(inProgressTime)

  useEffect(() => {
    if (open) {
      setLocalTimeMs(inProgressTime)
    }
  }, [open, inProgressTime])

  const handleTimeBlur = () => {
    if (localTimeMs !== inProgressTime) {
      onUpdateTime(localTimeMs)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-white/10 pt-10">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-2 h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => onOpenChange(false)}
          data-testid="button-close-status-dialog"
        >
          <X className={IconSize.HW4} />
        </Button>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isCompleted ? 'Restore Task?' : 'Task Status'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isCompleted
              ? `Move "${taskName}" back to your active task list.`
              : `Choose an action for "${taskName}"`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <div className="flex flex-col gap-3 w-full">
            {!isCompleted && (
              <>
                {showInProgressOption &&
                  (isInProgress ? (
                    <ChangeStatusButton
                      icon={StopCircle}
                      label="Stop Progress"
                      onClick={() => onSetStatus(TaskStatus.PINNED)}
                      data-testid="button-stop-progress"
                    />
                  ) : (
                    <ChangeStatusButton
                      icon={Clock}
                      label="In Progress"
                      onClick={() => onSetStatus(TaskStatus.IN_PROGRESS)}
                      data-testid="button-start-progress"
                      colorClass="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    />
                  ))}
                {isInProgress || isPinned ? (
                  <ChangeStatusButton
                    icon={PinOff}
                    label="Unpin"
                    onClick={() => onSetStatus(TaskStatus.OPEN)}
                    data-testid="button-unpin"
                  />
                ) : (
                  <ChangeStatusButton
                    icon={Pin}
                    label="Pin to Top"
                    onClick={() => onSetStatus(TaskStatus.PINNED)}
                    data-testid="button-pin"
                  />
                )}
              </>
            )}

            <AlertDialogAction
              onClick={() =>
                onSetStatus(
                  isCompleted ? TaskStatus.OPEN : TaskStatus.COMPLETED,
                )
              }
              className={cn(
                'w-full h-11 text-base font-semibold',
                isCompleted
                  ? 'bg-primary hover:bg-primary/90 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white',
              )}
              data-testid="button-complete-task"
            >
              {isCompleted ? 'Restore Task to Open' : 'Complete Task'}
            </AlertDialogAction>

            {showTimeInputs && (
              <TimeSpentInput
                onBlur={handleTimeBlur}
                localTimeMs={localTimeMs}
                setLocalTimeMs={setLocalTimeMs}
              />
            )}

            <div className="flex justify-center">
              <DeleteButton
                taskName={taskName}
                onConfirm={() => {
                  onOpenChange(false)
                  onDelete()
                }}
              />
            </div>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
