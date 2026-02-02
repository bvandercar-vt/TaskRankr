import { useEffect, useState } from 'react'
import { Clock, Pin, PinOff, StopCircle, X } from 'lucide-react'

import type { TaskStatus } from '@shared/schema'
import { Button } from '@/components/primitives/button'
import { Input } from '@/components/primitives/forms/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/primitives/overlays/alert-dialog'
import { getSettings } from '@/hooks/use-settings'
import { cn } from '@/lib/utils'

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

const parseTimeToMs = (hours: number, minutes: number): number => {
  return (hours * 3600 + minutes * 60) * 1000
}

const msToHoursMinutes = (ms: number): { hours: number; minutes: number } => {
  const totalMinutes = Math.floor(ms / 60_000)
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  }
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

  const settings = getSettings()
  const showTimeInputs = settings.enableInProgressTime

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
    const newTimeMs = parseTimeToMs(hours, minutes)
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
          <X className="w-4 h-4" />
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
                {/* Start/Stop Working button */}
                {isInProgress ? (
                  <Button
                    onClick={() => onSetStatus('open')}
                    variant="outline"
                    className="w-full h-11 text-base font-semibold gap-2 border-slate-400/50 text-slate-400 hover:bg-slate-500/10"
                    data-testid="button-stop-progress"
                  >
                    <StopCircle className="w-4 h-4" />
                    Stop Progress
                  </Button>
                ) : (
                  <Button
                    onClick={() => onSetStatus('in_progress')}
                    variant="outline"
                    className="w-full h-11 text-base font-semibold gap-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    data-testid="button-start-progress"
                  >
                    <Clock className="w-4 h-4" />
                    In Progress
                  </Button>
                )}

                {/* Pin/Unpin button */}
                {isInProgress || isPinned ? (
                  <Button
                    onClick={() => onSetStatus('open')}
                    variant="outline"
                    className="w-full h-11 text-base font-semibold gap-2 border-slate-400/50 text-slate-400 hover:bg-slate-500/10"
                    data-testid="button-unpin"
                  >
                    <PinOff className="w-4 h-4" />
                    Unpin
                  </Button>
                ) : (
                  <Button
                    onClick={() => onSetStatus('pinned')}
                    variant="outline"
                    className="w-full h-11 text-base font-semibold gap-2 border-slate-400/50 text-slate-400 hover:bg-slate-500/10"
                    data-testid="button-pin"
                  >
                    <Pin className="w-4 h-4" />
                    Pin to Top
                  </Button>
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
