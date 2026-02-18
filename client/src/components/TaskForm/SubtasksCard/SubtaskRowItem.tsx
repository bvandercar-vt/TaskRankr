import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, EyeOff, GripVertical, Pencil, Trash2 } from 'lucide-react'

import { useTaskActions, useTasks } from '@/hooks/useTasks'
import { getHasIncompleteSubtasks } from '@/lib/task-utils'
import { cn } from '@/lib/utils'
import type { DeleteTaskArgs } from '@/providers/LocalStateProvider'
import { SubtaskSortMode, type Task, TaskStatus } from '~/shared/schema'
import { Button } from '../../primitives/Button'
import { SubtaskBlockedTooltip } from '../../SubtaskBlockedTooltip'

export type Subtask = Task & { depth: number; subtaskIndex?: number }

const CompletedCheckbox = ({
  task,
  disabled,
}: {
  task: Subtask
  disabled: boolean
}) => {
  const { setTaskStatus } = useTaskActions()
  const isCompleted = task.status === TaskStatus.COMPLETED
  return (
    <SubtaskBlockedTooltip blocked={disabled}>
      <button
        type="button"
        onClick={() => {
          if (disabled) return
          const newStatus = isCompleted ? TaskStatus.OPEN : TaskStatus.COMPLETED
          setTaskStatus(task.id, newStatus)
        }}
        className={cn(
          'shrink-0 h-4 w-4 rounded-sm border transition-colors',
          disabled
            ? 'border-muted-foreground/20 opacity-50 cursor-not-allowed'
            : isCompleted
              ? 'bg-muted-foreground/60 border-muted-foreground/60 text-white'
              : 'border-muted-foreground/40 hover:border-muted-foreground',
        )}
        data-testid={`checkbox-complete-subtask-${task.id}`}
      >
        {isCompleted && <Check className="size-3 mx-auto" />}
      </button>
    </SubtaskBlockedTooltip>
  )
}

export interface SubtaskRowItemProps {
  task: Subtask
  onEdit?: (task: Task) => void
  onDelete: (task: DeleteTaskArgs) => void
  sortMode: SubtaskSortMode
  isDragDisabled?: boolean
  isHiddenItem?: boolean
}

export const SubtaskRowItem = ({
  task,
  onEdit,
  onDelete,
  sortMode,
  isDragDisabled,
  isHiddenItem,
}: SubtaskRowItemProps) => {
  const { data: allTasks } = useTasks()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isDragDisabled })

  const isManualSortMode = sortMode === SubtaskSortMode.MANUAL

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${12 + task.depth * 16}px`,
  }

  const isDirect = task.depth === 0
  const showDragHandle = isManualSortMode && isDirect
  const isCompleted = task.status === TaskStatus.COMPLETED
  const disableComplete =
    !isCompleted && getHasIncompleteSubtasks(allTasks, task.id)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center justify-between gap-2 px-3 py-1.5 bg-secondary/5 select-none',
        isDragging && 'opacity-50 bg-secondary/20',
      )}
      data-testid={`subtask-row-${task.id}`}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {showDragHandle && (
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing p-1 -ml-2 text-muted-foreground"
            {...attributes}
            {...listeners}
            data-testid={`drag-handle-${task.id}`}
          >
            <GripVertical className="size-4" />
          </button>
        )}
        {task.depth > 0 && (
          <span className="text-muted-foreground/50 text-xs leading-none">
            └
          </span>
        )}
        <CompletedCheckbox task={task} disabled={disableComplete} />
        <span
          className={cn(
            'text-sm break-words',
            isCompleted && 'line-through text-muted-foreground',
          )}
        >
          {task.subtaskIndex !== undefined && (
            <span className="text-muted-foreground mr-1">
              {task.subtaskIndex + 1}.
            </span>
          )}
          {task.name}
        </span>
        {isHiddenItem && (
          <EyeOff className="size-3 text-muted-foreground/50 shrink-0 ml-1" />
        )}
      </div>
      <div className="flex items-center gap-1">
        {onEdit && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onEdit(task)}
            data-testid={`button-edit-subtask-${task.id}`}
          >
            <Pencil className="size-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onDelete(task)}
          data-testid={`button-delete-subtask-${task.id}`}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}
