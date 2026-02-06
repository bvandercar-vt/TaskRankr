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
import { Input } from '@/components/primitives/forms/Input'
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
import { IconSizeStyle } from '@/lib/constants'
import { cn, hoursMinutesToMs, msToHoursMinutes } from '@/lib/utils'
import type { TaskStatus } from '~/shared/schema'

interface StatusButtonProps {
  icon: LucideIcon
  label: string
  onClick: () => void
  colorClass?: string
  'data-testid': string
}

const StatusButton = ({
  icon: Icon,
  label,
  onClick,
  colorClass = 'border-slate-400/50 text-slate-400 hover:bg-slate-500/10',
  'data-testid': testId,
}: StatusButtonProps) => (
  <Button
    onClick={onClick}
    variant="outline"
    className={cn('w-full h-11 text-base font-semibold gap-2', colorClass)}
    data-testid={testId}
  >
    <Icon className={IconSizeStyle.HW4} />
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
  onDeleteClick: () => void
}

export const ChangeStatusDialog = ({
  open,
  onOpenChange,
  taskName,
  status,
  inProgressTime,
  onSetStatus,
  onUpdateTime,
  onDeleteClick,
}: ChangeStatusDialogProps) => {
  const isCompleted = status === 'completed'
  const isInProgress = status === 'in_progress'
  const isPinned = status === 'pinned'

  const {
    settings: {
      enableInProgressStatus: showInProgressOption,
      enableInProgressTime: showTimeInputs,
    },
  } = useSettings()

  const { hours: initialHours, minutes: initialMinutes } =
    msToHoursMinutes(inProgressTime)
  const [hours, setHours] = useState(initialHours)
  const [minutes, setMinutes] = useState(initialMinutes)

  useEffect(() => {
    if (open) {
      const { hours: h, minutes: m } = msToHoursMinutes(inProgressTime)
      setHours(h)
      setMinutes(m)
    }
  }, [open, inProgressTime])

  const handleTimeChange = () => {
    const newTimeMs = hoursMinutesToMs(hours, minutes)
    if (newTimeMs !== inProgressTime) {
      onUpdateTime(newTimeMs)
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
          <X className={IconSizeStyle.HW4} />
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
                    <StatusButton
                      icon={StopCircle}
                      label="Stop Progress"
                      onClick={() => onSetStatus('open')}
                      data-testid="button-stop-progress"
                    />
                  ) : (
                    <StatusButton
                      icon={Clock}
                      label="In Progress"
                      onClick={() => onSetStatus('in_progress')}
                      data-testid="button-start-progress"
                      colorClass="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    />
                  ))}
                {isInProgress || isPinned ? (
                  <StatusButton
                    icon={PinOff}
                    label="Unpin"
                    onClick={() => onSetStatus('open')}
                    data-testid="button-unpin"
                  />
                ) : (
                  <StatusButton
                    icon={Pin}
                    label="Pin to Top"
                    onClick={() => onSetStatus('pinned')}
                    data-testid="button-pin"
                  />
                )}
              </>
            )}

            <AlertDialogAction
              onClick={() => onSetStatus(isCompleted ? 'open' : 'completed')}
              className={cn(
                'w-full h-11 text-base font-semibold',
                isCompleted
                  ? 'bg-primary hover:bg-primary/90 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white',
              )}
              data-testid="button-complete-task"
            >
              {isCompleted ? 'Restore Task' : 'Complete Task'}
            </AlertDialogAction>

            {showTimeInputs && (
              <div className="flex items-center justify-center gap-3 pt-2 border-t border-white/10">
                <span className="text-xs text-muted-foreground">
                  Time Spent
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      value={hours}
                      onChange={(e) =>
                        setHours(
                          Math.max(0, Number.parseInt(e.target.value) || 0),
                        )
                      }
                      onBlur={handleTimeChange}
                      className="w-16 h-8 text-center text-sm"
                      data-testid="input-hours"
                    />
                    <span className="text-xs text-muted-foreground">h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={minutes}
                      onChange={(e) =>
                        setMinutes(
                          Math.min(
                            59,
                            Math.max(0, Number.parseInt(e.target.value) || 0),
                          ),
                        )
                      }
                      onBlur={handleTimeChange}
                      className="w-16 h-8 text-center text-sm"
                      data-testid="input-minutes"
                    />
                    <span className="text-xs text-muted-foreground">m</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 h-8"
                onClick={onDeleteClick}
                data-testid="button-delete-task"
              >
                <span className="text-xs font-medium">Delete Permanently</span>
              </Button>
            </div>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
