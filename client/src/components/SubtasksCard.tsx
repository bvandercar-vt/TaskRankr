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
import {
  Check,
  ChevronDown,
  EyeOff,
  GripVertical,
  Link,
  Pencil,
  Plus,
  Settings2,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/primitives/Button'
import { CollapsibleCard } from '@/components/primitives/CollapsibleCard'
import { Switch } from '@/components/primitives/forms/Switch'
import { SubtaskBlockedTooltip } from '@/components/SubtaskBlockedTooltip'
import { useTaskActions, useTasks } from '@/hooks/useTasks'
import {
  getDirectSubtasks,
  getHasIncompleteSubtasks,
  getTaskById,
  sortTasksByIdOrder,
} from '@/lib/task-utils'
import { cn } from '@/lib/utils'
import type { DeleteTaskArgs } from '@/providers/LocalStateProvider'
import { SubtaskSortMode, type Task, TaskStatus } from '~/shared/schema'

interface SubtaskSettingsProps {
  taskId: number
  sortMode: SubtaskSortMode
  showNumbers: boolean
  autoHideCompleted: boolean
  inheritCompletionState: boolean
  showHidden: boolean
  hiddenCount: number
  directChildIds: number[]
  onSortModeChange: (mode: SubtaskSortMode) => void
  onShowNumbersChange: (show: boolean) => void
  onShowHiddenChange: (show: boolean) => void
}

const SubtaskSettings = ({
  taskId,
  sortMode,
  showNumbers,
  autoHideCompleted,
  inheritCompletionState,
  showHidden,
  hiddenCount,
  directChildIds,
  onSortModeChange,
  onShowNumbersChange,
  onShowHiddenChange,
}: SubtaskSettingsProps) => {
  const { updateTask, reorderSubtasks } = useTaskActions()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const isManualSortMode = sortMode === SubtaskSortMode.MANUAL

  const handleSortToggle = () => {
    const newMode: SubtaskSortMode = isManualSortMode
      ? SubtaskSortMode.INHERIT
      : SubtaskSortMode.MANUAL

    onSortModeChange(newMode)

    if (newMode === SubtaskSortMode.MANUAL && directChildIds.length > 0) {
      reorderSubtasks(taskId, directChildIds)
    }

    updateTask({ id: taskId, subtaskSortMode: newMode })
  }

  return (
    <div className="border-b border-white/5">
      <button
        type="button"
        className="flex items-center justify-between w-full px-3 py-2 text-xs text-muted-foreground hover:bg-secondary/10 transition-colors"
        onClick={() => setSettingsOpen(!settingsOpen)}
        data-testid="button-subtask-settings"
      >
        <span className="flex items-center gap-1.5 text-foreground">
          <Settings2 className="size-3.5" />
          Settings
        </span>
        <ChevronDown
          className={cn(
            'size-3.5 transition-transform duration-200',
            settingsOpen && 'rotate-180',
          )}
        />
      </button>
      {settingsOpen && (
        <div className="px-3 pb-2.5 space-y-3 bg-secondary/5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span
                className="text-xs text-muted-foreground"
                data-testid="label-sorting-method"
              >
                Sorting Method
              </span>
              <div className="flex items-center gap-3 flex-wrap">
                {isManualSortMode && (
                  // biome-ignore lint/a11y/noLabelWithoutControl: is present in the switch
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span className="text-xs text-muted-foreground">
                      Show numbers
                    </span>
                    <Switch
                      checked={showNumbers}
                      onCheckedChange={(checked) => {
                        onShowNumbersChange(checked)
                        updateTask({ id: taskId, subtasksShowNumbers: checked })
                      }}
                      data-testid="switch-show-numbers"
                    />
                  </label>
                )}
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
                        : 'bg-primary text-primary-foreground',
                    )}
                    data-testid="toggle-sort-inherit"
                  >
                    <input
                      type="radio"
                      name="subtask-sort-mode"
                      value={SubtaskSortMode.INHERIT}
                      checked={!isManualSortMode}
                      onChange={() => isManualSortMode && handleSortToggle()}
                      className="sr-only"
                    />
                    Inherit
                  </label>
                  <label
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                      isManualSortMode
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-transparent text-muted-foreground',
                    )}
                    data-testid="toggle-sort-manual"
                  >
                    <input
                      type="radio"
                      name="subtask-sort-mode"
                      value={SubtaskSortMode.MANUAL}
                      checked={isManualSortMode}
                      onChange={() => !isManualSortMode && handleSortToggle()}
                      className="sr-only"
                    />
                    Manual
                  </label>
                </div>
              </div>
            </div>
            <span
              className="text-[11px] text-muted-foreground/70 leading-snug text-right"
              data-testid="text-sort-caption"
            >
              {isManualSortMode
                ? 'Drag subtasks into your preferred order using the grip handles.'
                : 'Subtasks follow the same sort order as the main task list.'}
            </span>
          </div>

          {/* biome-ignore lint/a11y/noLabelWithoutControl: is present in the switch */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-muted-foreground">
              Auto-complete main task when all subtasks complete
            </span>
            <Switch
              checked={inheritCompletionState}
              onCheckedChange={(checked) => {
                updateTask({ id: taskId, inheritCompletionState: checked })
              }}
              data-testid="switch-inherit-completion-state"
            />
          </label>

          {/* biome-ignore lint/a11y/noLabelWithoutControl: is present in the switch */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-muted-foreground">
              Auto-hide completed
            </span>
            <Switch
              checked={autoHideCompleted}
              onCheckedChange={(checked) => {
                updateTask({ id: taskId, autoHideCompleted: checked })
              }}
              data-testid="switch-auto-hide-completed"
            />
          </label>

          {hiddenCount > 0 && (
            // biome-ignore lint/a11y/noLabelWithoutControl: is present in the switch
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-muted-foreground">
                Show Hidden ({hiddenCount})
              </span>
              <Switch
                checked={showHidden}
                onCheckedChange={onShowHiddenChange}
                data-testid="switch-show-hidden"
              />
            </label>
          )}
        </div>
      )}
    </div>
  )
}

type Subtask = Task & { depth: number; subtaskIndex?: number }

interface SubtaskItemProps {
  task: Subtask
  allTasks: Task[]
  onEdit?: (task: Task) => void
  onDelete: (task: DeleteTaskArgs) => void
  onToggleComplete: (task: Task) => void
  isManualSortMode: boolean
  isDragDisabled?: boolean
  isHiddenItem?: boolean
}

const SubtaskItem = ({
  task,
  allTasks,
  onEdit,
  onDelete,
  onToggleComplete,
  isManualSortMode,
  isDragDisabled,
  isHiddenItem,
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
        <SubtaskBlockedTooltip blocked={disableComplete}>
          <button
            type="button"
            onClick={() => !disableComplete && onToggleComplete(task)}
            className={cn(
              'shrink-0 h-4 w-4 rounded-sm border transition-colors',
              disableComplete
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

const SUBTASK_ACTION_BTN_STYLE =
  'flex items-center justify-center p-3 bg-secondary/5 hover:bg-secondary/15 transition-colors text-sm text-foreground hover:text-foreground'

interface SubtasksCardProps {
  task: Task
  onAddSubtask: (parentId: number) => void
  onEditSubtask?: (task: Task) => void
  onDeleteSubtask?: (task: DeleteTaskArgs) => void
  onAssignSubtask?: (task: Task) => void
}

export const SubtasksCard = ({
  task: taskProp,
  onAddSubtask,
  onEditSubtask,
  onDeleteSubtask,
  onAssignSubtask,
}: SubtasksCardProps) => {
  const { data: allTasks } = useTasks()
  const { setTaskStatus, reorderSubtasks } = useTaskActions()

  const task = getTaskById(allTasks, taskProp.id) ?? taskProp

  const [sortMode, setSortMode] = useState<SubtaskSortMode>(
    task.subtaskSortMode,
  )
  const isManualSortMode = sortMode === SubtaskSortMode.MANUAL
  const [showNumbers, setShowNumbers] = useState(task.subtasksShowNumbers)
  const [showHidden, setShowHidden] = useState(false)

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

  const allSubtasks = useMemo(() => {
    const collectDescendants = (
      parentId_: number,
      depth: number,
      parentSortMode: SubtaskSortMode,
      parentShowNumbers: boolean,
    ): Subtask[] => {
      let children = getDirectSubtasks(allTasks, parentId_)

      if (parentSortMode === SubtaskSortMode.MANUAL) {
        const order =
          depth === 0 && localSubtaskOrder
            ? localSubtaskOrder
            : (getTaskById(allTasks, parentId_)?.subtaskOrder ?? [])
        children = sortTasksByIdOrder(children, order)
      } else {
        children = [...children].sort((a, b) => {
          const ac = a.status === TaskStatus.COMPLETED ? 1 : 0
          const bc = b.status === TaskStatus.COMPLETED ? 1 : 0
          return ac - bc
        })
      }

      const result: Subtask[] = []
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        result.push({
          ...child,
          depth,
          subtaskIndex:
            parentShowNumbers && parentSortMode === SubtaskSortMode.MANUAL
              ? i
              : undefined,
        })
        result.push(
          ...collectDescendants(
            child.id,
            depth + 1,
            child.subtaskSortMode,
            child.subtasksShowNumbers,
          ),
        )
      }
      return result
    }

    return collectDescendants(task.id, 0, sortMode, showNumbers)
  }, [task, allTasks, sortMode, localSubtaskOrder, showNumbers])

  const hiddenSubtaskIds = useMemo(
    () => new Set(allSubtasks.filter((s) => s.hidden).map((s) => s.id)),
    [allSubtasks],
  )

  const hiddenCount = hiddenSubtaskIds.size

  const visibleSubtasks = useMemo(() => {
    if (showHidden) return allSubtasks
    return allSubtasks.filter((s) => !s.hidden)
  }, [allSubtasks, showHidden])

  const totalCount = allSubtasks.length

  const directChildIds = useMemo(
    () => visibleSubtasks.filter((t) => t.depth === 0).map((t) => t.id),
    [visibleSubtasks],
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
      {totalCount > 0 && (
        <CollapsibleCard
          title={
            <span className="text-sm font-medium">Subtasks ({totalCount})</span>
          }
          defaultOpen
          noCard
          className="bg-secondary/10"
          triggerClassName="p-3 hover:bg-secondary/20 transition-colors"
          contentClassName="mt-0"
          data-testid="button-toggle-subtasks"
        >
          <SubtaskSettings
            taskId={task.id}
            sortMode={sortMode}
            showNumbers={showNumbers}
            autoHideCompleted={task.autoHideCompleted}
            inheritCompletionState={task.inheritCompletionState}
            showHidden={showHidden}
            hiddenCount={hiddenCount}
            directChildIds={directChildIds}
            onSortModeChange={handleSortModeChange}
            onShowNumbersChange={setShowNumbers}
            onShowHiddenChange={setShowHidden}
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
                {visibleSubtasks.map((subtask) => (
                  <SubtaskItem
                    key={subtask.id}
                    task={subtask}
                    allTasks={allTasks}
                    onEdit={onEditSubtask}
                    onDelete={(t) => onDeleteSubtask?.(t)}
                    onToggleComplete={(t) => {
                      const newStatus =
                        t.status === TaskStatus.COMPLETED
                          ? TaskStatus.OPEN
                          : TaskStatus.COMPLETED
                      setTaskStatus(t.id, newStatus)
                    }}
                    isManualSortMode={isManualSortMode}
                    isDragDisabled={false}
                    isHiddenItem={hiddenSubtaskIds.has(subtask.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CollapsibleCard>
      )}
      <div className="flex border-t border-white/5">
        <button
          type="button"
          onClick={() => onAddSubtask(task.id)}
          className={cn(SUBTASK_ACTION_BTN_STYLE, 'flex-[4] gap-2')}
          data-testid="button-add-subtask"
        >
          <Plus className="size-4" />
          Add Subtask
        </button>
        <button
          type="button"
          onClick={() => onAssignSubtask?.(task)}
          className={cn(
            SUBTASK_ACTION_BTN_STYLE,
            'flex-1 gap-1.5 border-l border-white/5',
          )}
          data-testid="button-assign-subtask"
        >
          <Link className="size-4" />
          Assign
        </button>
      </div>
    </div>
  )
}
