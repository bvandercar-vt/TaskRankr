/**
 * @fileoverview Main task list (tree) page with sorting and filtering
 * capabilities.
 *
 */

import { useMemo, useState } from 'react'
import { LayoutList, Plus, Search } from 'lucide-react'

import { DropdownMenuHeader } from '@/components/DropdownMenuHeader'
import { HowToUseBanner } from '@/components/HowToUseBanner'
import {
  EmptyState as EmptyStateBase,
  PageError,
  PageLoading,
} from '@/components/PageStates'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/components/primitives/LucideIcon'
import { useLocalState } from '@/components/providers/LocalStateProvider'
import { useTaskDialog } from '@/components/providers/TaskFormDialogProvider'
import { SortButton } from '@/components/SortButton'
import { TaskCard } from '@/components/TaskCard'
import { useSettings } from '@/hooks/useSettings'
import { useTasks } from '@/hooks/useTasks'
import { IconSize } from '@/lib/constants'
import {
  filterAndSortTree,
  RANK_FIELDS_COLUMNS,
  SORT_ORDER_MAP,
} from '@/lib/sort-tasks'
import { cn } from '@/lib/utils'
import {
  type FieldConfig,
  SortOption,
  TaskStatus,
  type TaskWithSubtasks,
} from '~/shared/schema'

const SortButtons = ({
  sortBy,
  setSortBy,
  fieldConfig,
}: {
  sortBy: SortOption
  setSortBy: (value: SortOption) => void
  fieldConfig: FieldConfig
}) => (
  <div className="flex items-center gap-1">
    <SortButton
      label="Date"
      value={SortOption.DATE_CREATED}
      className="min-w-12 max-w-16"
      current={sortBy}
      onSelect={setSortBy}
    />
    {RANK_FIELDS_COLUMNS.map((field) =>
      fieldConfig[field.name].visible ? (
        <SortButton
          key={`${field.name}-sort-btn`}
          label={field.labelShort ?? field.label}
          value={field.name}
          className="w-16"
          current={sortBy}
          onSelect={setSortBy}
        />
      ) : null,
    )}
  </div>
)

const DeleteDemoDataButton = ({ onClick }: { onClick: () => void }) => (
  <div className="mt-12 pt-6 flex justify-center">
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive bg-destructive/10 hover:text-destructive hover:bg-destructive/15"
      onClick={onClick}
      data-testid="button-delete-demo-data"
    >
      Delete Demo Data
    </Button>
  </div>
)

const CreateTaskButton = ({ onClick }: { onClick: () => void }) => (
  <Button
    onClick={onClick}
    size="icon"
    className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground z-50 transition-transform active:scale-95 border-0"
    data-testid="button-create-task"
  >
    <Plus className={IconSize.HW6} />
  </Button>
)

const EmptyState = ({
  search,
  onCreateClick,
}: {
  search: string | undefined
  onCreateClick: () => void
}) => (
  <EmptyStateBase
    icon={
      <Icon
        icon={search ? Search : LayoutList}
        className={cn(IconSize.HW8, 'text-muted-foreground')}
      />
    }
    title={search ? 'No matching tasks found' : 'Your list is empty'}
    description={
      search
        ? 'Try adjusting your search terms.'
        : 'Start by adding your first task to get organized.'
    }
    action={
      !search && (
        <Button onClick={onCreateClick} variant="secondary" className="mt-4">
          Create First Task
        </Button>
      )
    }
  />
)

const Home = () => {
  const { data: allTasks, isLoading, error } = useTasks()
  const { openCreateDialog } = useTaskDialog()
  const { settings, updateSettings } = useSettings()
  const { hasDemoData, deleteDemoData } = useLocalState()
  const [search, setSearch] = useState('')

  const sortBy = settings.sortBy
  const setSortBy = (value: SortOption) => updateSettings({ sortBy: value })

  // Build tree from flat list, excluding completed tasks
  // Also extract in-progress and pinned tasks to be hoisted to top
  // Pinned/in-progress subtasks appear both hoisted AND under their parent
  const { taskTree, inProgressTask, pinnedTasks } = useMemo(() => {
    const activeTasks = allTasks.filter(
      (task) => task.status !== TaskStatus.COMPLETED || task.parentId !== null,
    )

    let inProgress: TaskWithSubtasks | undefined
    const pinnedList: TaskWithSubtasks[] = []
    const hoistedIds = new Set<number>()

    activeTasks.forEach((task) => {
      if (task.status === TaskStatus.IN_PROGRESS) {
        inProgress = { ...task, subtasks: [] }
        hoistedIds.add(task.id)
      } else if (task.status === TaskStatus.PINNED) {
        pinnedList.push({ ...task, subtasks: [] })
        hoistedIds.add(task.id)
      }
    })

    const nodes: Record<number, TaskWithSubtasks> = {}
    const roots: TaskWithSubtasks[] = []

    activeTasks.forEach((task) => {
      nodes[task.id] = { ...task, subtasks: [] }
    })

    activeTasks.forEach((task) => {
      if (task.parentId && nodes[task.parentId]) {
        nodes[task.parentId].subtasks.push(nodes[task.id])
      } else if (!task.parentId && !hoistedIds.has(task.id)) {
        roots.push(nodes[task.id])
      }
    })

    return {
      taskTree: roots,
      inProgressTask: inProgress,
      pinnedTasks: pinnedList,
    }
  }, [allTasks])

  const displayedTasks = useMemo(() => {
    const sortOrder = SORT_ORDER_MAP[sortBy]
    const sortedInProgress = inProgressTask
      ? filterAndSortTree([inProgressTask], search, sortOrder)
      : []

    const sortedPinned = filterAndSortTree(
      pinnedTasks,
      search,
      settings.alwaysSortPinnedByPriority && sortBy !== SortOption.PRIORITY
        ? [SortOption.PRIORITY, ...sortOrder]
        : sortOrder,
    )

    const sortedTree = filterAndSortTree(taskTree, search, sortOrder)
    return [...sortedInProgress, ...sortedPinned, ...sortedTree]
  }, [taskTree, inProgressTask, pinnedTasks, search, sortBy, settings])

  if (isLoading) return <PageLoading />
  if (error) return <PageError />

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <div className="shrink-0 max-w-5xl w-full mx-auto px-2 sm:px-4 pt-8">
        <HowToUseBanner />

        <h1 className="sr-only">Home (Open Tasks)</h1>

        <DropdownMenuHeader search={search} onSearchChange={setSearch}>
          <SortButtons
            sortBy={sortBy}
            setSortBy={setSortBy}
            fieldConfig={settings.fieldConfig}
          />
        </DropdownMenuHeader>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-32">
        <div className="max-w-5xl mx-auto px-2 sm:px-4 space-y-1">
          {displayedTasks.length === 0 ? (
            <EmptyState
              search={search}
              onCreateClick={() => openCreateDialog()}
            />
          ) : (
            displayedTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}

          {hasDemoData && displayedTasks.length > 0 && (
            <DeleteDemoDataButton onClick={deleteDemoData} />
          )}
        </div>
      </div>

      <CreateTaskButton onClick={() => openCreateDialog()} />
    </div>
  )
}

export default Home
