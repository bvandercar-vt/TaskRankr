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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Link, Plus } from 'lucide-react'

import { useTaskActions, useTasks } from '@/hooks/useTasks'
import {
  getDirectSubtasks,
  getTaskById,
  sortTasksByIdOrder,
} from '@/lib/task-utils'
import { cn } from '@/lib/utils'
import type { DeleteTaskArgs } from '@/providers/LocalStateProvider'
import { SubtaskSortMode, type Task, TaskStatus } from '~/shared/schema'
import { CollapsibleCard } from '../../primitives/CollapsibleCard'
import { type Subtask, SubtaskRowItem } from './SubtaskRowItem'
import { SubtasksSettings } from './SubtasksSettings'

const ADD_SUBTASK_BTN_CLASS =
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
  const { reorderSubtasks } = useTaskActions()

  const task = getTaskById(allTasks, taskProp.id) ?? taskProp

  const [sortMode, setSortMode] = useState<SubtaskSortMode>(
    task.subtaskSortMode,
  )
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
          <SubtasksSettings
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
                  <SubtaskRowItem
                    key={subtask.id}
                    task={subtask}
                    onEdit={onEditSubtask}
                    onDelete={(t) => onDeleteSubtask?.(t)}
                    sortMode={sortMode}
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
          className={cn(ADD_SUBTASK_BTN_CLASS, 'flex-[4] gap-2')}
          data-testid="button-add-subtask"
        >
          <Plus className="size-4" />
          Add Subtask
        </button>
        <button
          type="button"
          onClick={() => onAssignSubtask?.(task)}
          className={cn(
            ADD_SUBTASK_BTN_CLASS,
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
