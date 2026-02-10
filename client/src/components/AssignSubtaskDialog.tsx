/**
 * @fileoverview Dialog to assign an existing parentless task as a subtask
 */

import { useCallback, useMemo, useState } from 'react'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { Button } from '@/components/primitives/Button'
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/primitives/overlays/Dialog'
import { IconSize } from '@/lib/constants'
import { SearchInput } from '@/components/SearchInput'
import { useTaskActions, useTasks } from '@/hooks/useTasks'
import { filterRootTasks } from '@/lib/sort-tasks'
import { cn } from '@/lib/utils'
import { SubtaskSortMode, type Task, TaskStatus } from '~/shared/schema'

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
    onOpenChange(false)
  }

  const handleClose = () => {
    setSelectedId(null)
    setSearch('')
    onOpenChange(false)
  }

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setSelectedId(null)
          setSearch('')
        }
        onOpenChange(v)
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-[200] grid w-full max-w-sm translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
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
              disabled={selectedId === null}
              data-testid="button-confirm-assign"
            >
              Confirm
            </Button>
          </div>
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className={IconSize.HW4} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
