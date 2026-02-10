/**
 * @fileoverview Dialog to assign an existing parentless task as a subtask
 */

import { useCallback, useMemo, useState } from 'react'

import { Button } from '@/components/primitives/Button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/primitives/overlays/Dialog'
import { SearchInput } from '@/components/SearchInput'
import { useTaskActions } from '@/hooks/useTasks'
import { cn } from '@/lib/utils'
import { SubtaskSortMode, type Task, TaskStatus } from '~/shared/schema'

interface AssignSubtaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentTask: Task
  allTasks: Task[]
}

export const AssignSubtaskDialog = ({
  open,
  onOpenChange,
  parentTask,
  allTasks,
}: AssignSubtaskDialogProps) => {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
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
        t.status !== TaskStatus.COMPLETED,
    )
  }, [allTasks, parentTask.id, collectDescendantIds])

  const filteredTasks = useMemo(() => {
    if (!search.trim()) return orphanTasks
    const q = search.toLowerCase()
    return orphanTasks.filter((t) => t.name.toLowerCase().includes(q))
  }, [orphanTasks, search])

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
    onOpenChange(false)
  }

  const handleClose = () => {
    setSelectedId(null)
    setSearch('')
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setSelectedId(null)
          setSearch('')
        }
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-sm">
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
        <div
          className="max-h-64 overflow-y-auto divide-y divide-white/5"
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
                )}
                data-testid={`button-assign-task-${t.id}`}
              >
                {t.name}
              </button>
            ))
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            data-testid="button-cancel-assign"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedId === null}
            data-testid="button-confirm-assign"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
