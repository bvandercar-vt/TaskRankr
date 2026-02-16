/**
 * @fileoverview Dialog to assign an existing parentless task as a subtask
 */

import { useCallback, useMemo, useState } from 'react'

import { Button } from '@/components/primitives/Button'
import { Checkbox } from '@/components/primitives/forms/Checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/primitives/overlays/Dialog'
import { SearchInput } from '@/components/SearchInput'
import { useTaskActions, useTasks } from '@/hooks/useTasks'
import { filterRootTasks } from '@/lib/sort-tasks'
import { cn } from '@/lib/utils'
import { SubtaskSortMode, type Task, TaskStatus } from '~/shared/schema'

const LAYER_CLASS = 'z-[200]'

interface AssignSubtaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentTask: Task
}

export const AssignSubtaskDialog = ({
  open,
  onOpenChange,
  parentTask,
}: AssignSubtaskDialogProps) => {
  const { data: allTasks } = useTasks()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const { updateTask } = useTaskActions()

  const collectDescendantIds = useCallback(
    (taskId: number): Set<number> => {
      const ids = new Set<number>()
      const walk = (id: number) => {
        ids.add(id)
        for (const t of allTasks) {
          if (t.parentId === id) walk(t.id)
        }
      }
      walk(taskId)
      return ids
    },
    [allTasks],
  )

  const orphanTasks = useMemo(() => {
    const descendantIds = collectDescendantIds(parentTask.id)
    return allTasks.filter(
      (t) =>
        t.parentId === null &&
        t.id !== parentTask.id &&
        !descendantIds.has(t.id) &&
        (showCompleted || t.status !== TaskStatus.COMPLETED),
    )
  }, [allTasks, parentTask.id, collectDescendantIds, showCompleted])

  const filteredTasks = useMemo(
    () => filterRootTasks(orphanTasks, search),
    [orphanTasks, search],
  )

  const handleConfirm = () => {
    if (selectedId === null) return
    updateTask({ id: selectedId, parentId: parentTask.id })
    if (parentTask.subtaskSortMode === SubtaskSortMode.MANUAL) {
      updateTask({
        id: parentTask.id,
        subtaskOrder: [...parentTask.subtaskOrder, selectedId],
      })
    }
    setSelectedId(null)
    setSearch('')
    setShowCompleted(false)
    onOpenChange(false)
  }

  const handleClose = () => {
    setSelectedId(null)
    setSearch('')
    setShowCompleted(false)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setSelectedId(null)
          setSearch('')
          setShowCompleted(false)
        }
        onOpenChange(v)
      }}
    >
      <DialogContent
        className={cn('max-w-sm rounded-lg', LAYER_CLASS)}
        overlayClassName={LAYER_CLASS}
      >
        <DialogHeader>
          <DialogTitle data-testid="title-assign-subtask">
            Assign Subtask
          </DialogTitle>
        </DialogHeader>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter tasks..."
          autoFocus
          data-testid="search-assign-tasks"
        />
        {/** biome-ignore lint/a11y/noLabelWithoutControl: Checkbox is an input*/}
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <Checkbox
            checked={showCompleted}
            onCheckedChange={(v) => setShowCompleted(v === true)}
            data-testid="checkbox-show-completed"
          />
          Show Completed
        </label>
        <div
          className="h-64 overflow-y-auto divide-y divide-white/5"
          data-testid="list-orphan-tasks"
        >
          {filteredTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {search.trim()
                ? 'No matching tasks'
                : 'No available tasks to assign'}
            </p>
          ) : (
            filteredTasks.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  'w-full text-left px-3 py-2.5 text-sm transition-colors',
                  selectedId === t.id
                    ? 'bg-primary/20 text-foreground'
                    : 'hover-elevate text-muted-foreground',
                  t.status === TaskStatus.COMPLETED && 'opacity-50',
                )}
                data-testid={`button-assign-task-${t.id}`}
              >
                {t.name}
              </button>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            data-testid="button-cancel-assign"
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={!selectedId}
            data-testid="button-confirm-assign"
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
