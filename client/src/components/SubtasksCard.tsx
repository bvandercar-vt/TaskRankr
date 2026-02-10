/**
 * @fileoverview Subtask list with drag-and-drop reordering for the task form
 */

import { useMemo, useState } from 'react'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/primitives/Button'
import { Switch } from '@/components/primitives/forms/Switch'
import { CollapsibleCard } from '@/components/primitives/CollapsibleCard'
import { useTaskActions, useTasks } from '@/hooks/useTasks'
import { IconSizeStyle } from '@/lib/constants'
import { sortTasksByIdOrder } from '@/lib/sort-tasks'
import { cn } from '@/lib/utils'
import {
  SubtaskSortMode,
  type Task,
  TaskStatus,
  type TaskWithSubtasks,
} from '~/shared/schema'
import type { DeleteTaskArgs } from './providers/LocalStateProvider'

interface SortModeToggleProps {
  taskId: number
  initialSortMode: SubtaskSortMode
  directChildIds: number[]
  showNumbers: boolean
  onSortModeChange: (mode: SubtaskSortMode) => void
  onShowNumbersChange: (show: boolean) => void
}

const SortModeToggle = ({
  taskId,
  initialSortMode,
  directChildIds,
  showNumbers,
  onSortModeChange,
  onShowNumbersChange,
}: SortModeToggleProps) => {
  const { updateTask, reorderSubtasks } = useTaskActions()

  const [sortMode, setSortMode] = useState<SubtaskSortMode>(initialSortMode)
  const isManualSortMode = sortMode === SubtaskSortMode.MANUAL

  const handleToggle = () => {
    const newMode: SubtaskSortMode = isManualSortMode
      ? SubtaskSortMode.INHERIT
      : SubtaskSortMode.MANUAL

    setSortMode(newMode)
    onSortModeChange(newMode)

    if (newMode === SubtaskSortMode.MANUAL && directChildIds.length > 0) {
      reorderSubtasks(taskId, directChildIds)
    }

    updateTask({ id: taskId, subtaskSortMode: newMode })
  }

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2.5 border-b border-white/5 bg-secondary/5">
      <span
        className="text-xs font-medium text-muted-foreground"
        data-testid="label-sorting-method"
      >
        Sorting Method
      </span>
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="inline-flex rounded-md border border-white/10 overflow-hidden"
          role="radiogroup"
          aria-label="Subtask sort order"
          data-testid="toggle-sort-mode"
        >
          <label
            className={cn(
              'px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              isManualSortMode
                ? 'bg-transparent text-muted-foreground'
                : 'bg-secondary text-foreground',
            )}
            data-testid="toggle-sort-inherit"
          >
            <input
              type="radio"
              name="subtask-sort-mode"
              value={SubtaskSortMode.INHERIT}
              checked={!isManualSortMode}
              onChange={() => isManualSortMode && handleToggle()}
              className="sr-only"
            />
            Inherit
          </label>
          <label
            className={cn(
              'px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              isManualSortMode
                ? 'bg-secondary text-foreground'
                : 'bg-transparent text-muted-foreground',
            )}
            data-testid="toggle-sort-manual"
          >
            <input
              type="radio"
              name="subtask-sort-mode"
              value={SubtaskSortMode.MANUAL}
              checked={isManualSortMode}
              onChange={() => !isManualSortMode && handleToggle()}
              className="sr-only"
            />
            Manual
          </label>
        </div>
        {isManualSortMode && (
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Switch
              checked={showNumbers}
              onCheckedChange={onShowNumbersChange}
              data-testid="switch-show-numbers"
            />
            <span className="text-xs text-muted-foreground">Show numbers</span>
          </label>
        )}
      </div>
      <span
        className="text-[11px] text-muted-foreground/70 leading-snug"
        data-testid="text-sort-caption"
      >
        {isManualSortMode
          ? 'Drag subtasks into your preferred order using the grip handles.'
          : 'Subtasks follow the same sort order as the main task list.'}
      </span>
    </div>
  )
}

interface SubtaskItemProps {
  task: Task & { depth: number }
  onEdit?: (task: Task) => void
  onDelete: (task: DeleteTaskArgs) => void
  onToggleComplete: (task: Task) => void
  isManualSortMode: boolean
  isDragDisabled?: boolean
  numberPrefix?: string
}

const SubtaskItem = ({
  task,
  onEdit,
  onDelete,
  onToggleComplete,
  isManualSortMode,
  isDragDisabled,
  numberPrefix,
}: SubtaskItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isDragDisabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${12 + task.depth * 16}px`,
  }

  const isDirect = task.depth === 0
  const showDragHandle = isManualSortMode && isDirect
  const isCompleted = task.status === TaskStatus.COMPLETED

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
            <GripVertical className={IconSizeStyle.HW4} />
          </button>
        )}
        {task.depth > 0 && (
          <span className="text-muted-foreground/50 text-xs leading-none">
            └
          </span>
        )}
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          className={cn(
            'shrink-0 h-4 w-4 rounded-sm border transition-colors',
            isCompleted
              ? 'bg-muted-foreground/60 border-muted-foreground/60 text-white'
              : 'border-muted-foreground/40 hover:border-muted-foreground',
          )}
          data-testid={`checkbox-complete-subtask-${task.id}`}
        >
          {isCompleted && <Check className="h-3 w-3 mx-auto" />}
        </button>
        <span
          className={cn(
            'text-sm truncate',
            isCompleted && 'line-through text-muted-foreground',
          )}
        >
          {numberPrefix && (
            <span className="text-muted-foreground mr-1">{numberPrefix}</span>
          )}
          {task.name}
        </span>
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
            <Pencil className={IconSizeStyle.HW4} />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onDelete(task)}
          data-testid={`button-delete-subtask-${task.id}`}
        >
          <Trash2 className={cn(IconSizeStyle.HW4, 'text-destructive')} />
        </Button>
      </div>
    </div>
  )
}

interface SubtasksCardProps {
  task: Task
  onAddChild: (parentId: number) => void
  onEditChild?: (task: Task) => void
  onSubtaskDelete?: (task: DeleteTaskArgs) => void
}

export const SubtasksCard = ({
  task,
  onAddChild,
  onEditChild,
  onSubtaskDelete,
}: SubtasksCardProps) => {
  const { data: allTasks } = useTasks()
  const { setTaskStatus, reorderSubtasks } = useTaskActions()

  const [sortMode, setSortMode] = useState<SubtaskSortMode>(
    task.subtaskSortMode,
  )
  const isManualSortMode = sortMode === SubtaskSortMode.MANUAL
  const [showNumbers, setShowNumbers] = useState(false)

  const [localSubtaskOrder, setLocalSubtaskOrder] = useState<number[] | null>(
    null,
  )

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const subtasks = useMemo(() => {
    const flattenTasks = (tasks: TaskWithSubtasks[]): TaskWithSubtasks[] => {
      const result: TaskWithSubtasks[] = []
      for (const t of tasks) {
        result.push(t)
        if (t.subtasks.length > 0) {
          result.push(...flattenTasks(t.subtasks))
        }
      }
      return result
    }
    const flatList = flattenTasks(allTasks)

    const collectDescendants = (
      parentId_: number,
      depth: number,
      parentSortMode: SubtaskSortMode,
    ): (TaskWithSubtasks & { depth: number })[] => {
      let children = flatList.filter((t) => t.parentId === parentId_)

      if (parentSortMode === SubtaskSortMode.MANUAL) {
        const order =
          depth === 0 && localSubtaskOrder
            ? localSubtaskOrder
            : (flatList.find((t) => t.id === parentId_)?.subtaskOrder ?? [])
        children = sortTasksByIdOrder(children, order)
      }

      const result: Array<TaskWithSubtasks & { depth: number }> = []
      for (const child of children) {
        result.push({ ...child, depth })
        result.push(
          ...collectDescendants(child.id, depth + 1, child.subtaskSortMode),
        )
      }
      return result
    }

    return collectDescendants(task.id, 0, sortMode)
  }, [task, allTasks, sortMode, localSubtaskOrder])

  const directChildIds = useMemo(
    () => subtasks.filter((t) => t.depth === 0).map((t) => t.id),
    [subtasks],
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = directChildIds.indexOf(active.id as number)
      const newIndex = directChildIds.indexOf(over.id as number)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(directChildIds, oldIndex, newIndex)
        setLocalSubtaskOrder(newOrder)
        reorderSubtasks(task.id, newOrder)
      }
    }
  }

  const handleSortModeChange = (newMode: SubtaskSortMode) => {
    setSortMode(newMode)
    setLocalSubtaskOrder(null)
  }

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      {subtasks.length > 0 && (
        <CollapsibleCard
          title={
            <span className="text-sm font-medium">
              Subtasks ({subtasks.length})
            </span>
          }
          noCard
          className="bg-secondary/10"
          triggerClassName="p-3 hover:bg-secondary/20 transition-colors"
          contentClassName="mt-0"
          data-testid="button-toggle-subtasks"
        >
          <SortModeToggle
            taskId={task.id}
            initialSortMode={task.subtaskSortMode}
            directChildIds={directChildIds}
            showNumbers={showNumbers}
            onSortModeChange={handleSortModeChange}
            onShowNumbersChange={setShowNumbers}
          />
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={directChildIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-white/5">
                {subtasks.map((subtask, index) => {
                  let numberPrefix: string | undefined
                  if (showNumbers && isManualSortMode && subtask.depth === 0) {
                    const directIndex =
                      subtasks
                        .slice(0, index + 1)
                        .filter((t) => t.depth === 0).length
                    numberPrefix = `${directIndex}.`
                  }

                  return (
                    <SubtaskItem
                      key={subtask.id}
                      task={subtask}
                      onEdit={onEditChild}
                      onDelete={(t) => onSubtaskDelete?.(t)}
                      onToggleComplete={(t) => {
                        const newStatus =
                          t.status === TaskStatus.COMPLETED
                            ? TaskStatus.OPEN
                            : TaskStatus.COMPLETED
                        setTaskStatus(t.id, newStatus)
                      }}
                      isManualSortMode={isManualSortMode}
                      isDragDisabled={false}
                      numberPrefix={numberPrefix}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        </CollapsibleCard>
      )}
      <button
        type="button"
        onClick={() => onAddChild(task.id)}
        className="w-full flex items-center justify-center gap-2 p-3 bg-secondary/5 hover:bg-secondary/15 transition-colors text-sm text-muted-foreground hover:text-foreground border-t border-white/5"
        data-testid="button-add-subtask"
      >
        <Plus className={IconSizeStyle.HW4} />
        Add Subtask
      </button>
    </div>
  )
}
