/**
 * @fileoverview Main task list (tree) page with sorting and filtering
 * capabilities.
 *
 */

import { useCallback, useMemo, useState } from 'react'
import { LayoutList, Plus, Search } from 'lucide-react'

import { HowToUseBanner } from '@/components/HowToUseBanner'
import { MainDropdownMenu } from '@/components/MainDropdownMenu'
import { EmptyState, PageError, PageLoading } from '@/components/PageStates'
import { Button } from '@/components/primitives/Button'
import { Input } from '@/components/primitives/forms/Input'
import { Icon } from '@/components/primitives/LucideIcon'
import { useTaskDialog } from '@/components/providers/TaskFormDialogProvider'
import { TaskCard } from '@/components/TaskCard'
import { useGuestModeState } from '@/hooks/useGuestModeState'
import { useSettings } from '@/hooks/useSettings'
import { sortTasksByOrder, useTasks } from '@/hooks/useTasks'
import { IconSizeStyle } from '@/lib/constants'
import {
  RANK_FIELDS_COLUMNS,
  SORT_ORDER_MAP,
  sortTasks,
} from '@/lib/sort-tasks'
import { cn } from '@/lib/utils'
import {
  SortOption,
  SubtaskSortMode,
  TaskStatus,
  type TaskWithSubtasks,
} from '~/shared/schema'

const SortButton = ({
  label,
  value,
  className,
  current,
  onSelect,
}: {
  label: string
  value: SortOption
  className?: string
  current: SortOption
  onSelect: (v: SortOption) => void
}) => (
  <Button
    variant={current === value ? 'default' : 'ghost'}
    size="sm"
    onClick={() => onSelect(value)}
    className={cn(
      'h-8 p-0 text-[10px] font-bold uppercase tracking-wider transition-all rounded-md no-default-hover-elevate no-default-active-elevate',
      current === value
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
      className,
    )}
    data-testid={`button-sort-${value}`}
  >
    {label}
  </Button>
)

const Home = () => {
  const { data: tasks, isLoading, error } = useTasks()
  const { openCreateDialog } = useTaskDialog()
  const { settings, updateSettings } = useSettings()
  const { isGuestMode, exitGuestMode, hasDemoData, deleteDemoData } =
    useGuestModeState()
  const [search, setSearch] = useState('')
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)

  const sortBy = settings.sortBy
  const setSortBy = (value: SortOption) => updateSettings({ sortBy: value })

  // Recursive function to filter task tree, respecting manual sort mode for subtasks
  const filterAndSortTree = useCallback(
    (
      nodes: TaskWithSubtasks[],
      term: string,
      sort: SortOption,
      parentSortMode?: SubtaskSortMode,
      parentSubtaskOrder?: number[],
    ): TaskWithSubtasks[] => {
      const result = nodes.reduce((acc: TaskWithSubtasks[], node) => {
        const matches = node.name.toLowerCase().includes(term.toLowerCase())
        const filteredSubtasks = filterAndSortTree(
          node.subtasks,
          term,
          sort,
          node.subtaskSortMode,
          node.subtaskOrder,
        )

        if (matches || filteredSubtasks.length > 0) {
          acc.push({ ...node, subtasks: filteredSubtasks })
        }
        return acc
      }, [])

      if (parentSortMode === SubtaskSortMode.MANUAL && parentSubtaskOrder) {
        return sortTasksByOrder(result, parentSubtaskOrder)
      }

      return sortTasks(result, SORT_ORDER_MAP[sort])
    },
    [],
  )

  // Build tree from flat list, excluding completed tasks
  // Also extract in-progress and pinned tasks to be hoisted to top
  // Pinned/in-progress subtasks appear both hoisted AND under their parent
  const { taskTree, pinnedTasks } = useMemo(() => {
    if (!tasks) return { taskTree: [], pinnedTasks: [] }

    // Filter out completed ROOT tasks (completed subtasks stay under their parent)
    const activeTasks = tasks.filter(
      (task) => task.status !== TaskStatus.COMPLETED || task.parentId !== null,
    )

    // Collect tasks to hoist:
    // - All in_progress tasks (both top-level and subtasks)
    // - All pinned tasks (both top-level and subtasks)
    // Subtasks also remain visible under their parent (with minimal styling)
    const inProgressList: TaskWithSubtasks[] = []
    const pinnedList: TaskWithSubtasks[] = []
    const hoistedIds = new Set<number>()

    activeTasks.forEach((task) => {
      if (task.status === TaskStatus.IN_PROGRESS) {
        inProgressList.push({ ...task, subtasks: [] })
        hoistedIds.add(task.id)
      } else if (task.status === TaskStatus.PINNED) {
        pinnedList.push({ ...task, subtasks: [] })
        hoistedIds.add(task.id)
      }
    })

    // Hoisted order: in_progress first, then pinned
    const hoistedList = [...inProgressList, ...pinnedList]

    // Build full tree
    // - Subtasks with pinned/in_progress status stay under parent (also shown hoisted)
    // - Top-level pinned/in_progress are excluded from tree (only shown hoisted)
    const nodes: Record<number, TaskWithSubtasks> = {}
    const roots: TaskWithSubtasks[] = []

    activeTasks.forEach((task) => {
      nodes[task.id] = { ...task, subtasks: [] }
    })

    activeTasks.forEach((task) => {
      if (task.parentId && nodes[task.parentId]) {
        // Subtasks always go under their parent (even if pinned/in_progress)
        nodes[task.parentId].subtasks.push(nodes[task.id])
      } else if (!task.parentId && !hoistedIds.has(task.id)) {
        // Top-level tasks go to roots unless they're hoisted
        roots.push(nodes[task.id])
      }
    })

    return { taskTree: roots, pinnedTasks: hoistedList }
  }, [tasks])

  const displayedTasks = useMemo(() => {
    if (!taskTree) return []
    const sortedTree = filterAndSortTree(taskTree, search, sortBy)

    // Filter pinned tasks by search term
    const filteredPinned = pinnedTasks.filter((task) =>
      task.name.toLowerCase().includes(search.toLowerCase()),
    )

    // Separate in_progress (always first) from pinned, then sort pinned
    const inProgressTask = filteredPinned.filter(
      (t) => t.status === TaskStatus.IN_PROGRESS,
    )
    const pinnedOnly = filteredPinned.filter(
      (t) => t.status === TaskStatus.PINNED,
    )

    const pinnedSortChain =
      settings.alwaysSortPinnedByPriority && sortBy !== SortOption.PRIORITY
        ? [SortOption.PRIORITY, ...SORT_ORDER_MAP[sortBy]]
        : SORT_ORDER_MAP[sortBy]
    const sortedPinned = sortTasks(pinnedOnly, pinnedSortChain)

    // Combine: in_progress first, then sorted pinned, then sorted tree
    return [...inProgressTask, ...sortedPinned, ...sortedTree]
  }, [taskTree, pinnedTasks, search, sortBy, filterAndSortTree, settings])

  if (isLoading) return <PageLoading />
  if (error) return <PageError />

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <main className="max-w-5xl mx-auto px-2 sm:px-4 py-8">
        <HowToUseBanner />
        <div className="flex items-center justify-between mb-4 pr-2">
          <div className="flex items-center gap-2">
            <MainDropdownMenu
              isGuestMode={isGuestMode}
              exitGuestMode={exitGuestMode}
              onSearchToggle={() => setIsSearchExpanded(!isSearchExpanded)}
            />

            {isSearchExpanded && (
              <div className="flex items-center bg-secondary/30 rounded-full border border-white/5 px-4 h-10 w-64">
                <Search
                  className={cn(IconSizeStyle.HW4, 'shrink-0 text-primary')}
                />
                <Input
                  placeholder="Search..."
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-full p-0 ml-3 text-sm placeholder:text-muted-foreground/50"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onBlur={() => !search && setIsSearchExpanded(false)}
                  data-testid="input-search"
                />
              </div>
            )}
          </div>

          {/* Sort Buttons */}
          <div className="flex items-center gap-1">
            <SortButton
              label="Date"
              value={SortOption.DATE}
              className="min-w-12 max-w-16"
              current={sortBy}
              onSelect={setSortBy}
            />
            {RANK_FIELDS_COLUMNS.map((field) =>
              settings.fieldConfig[field.name].visible ? (
                <SortButton
                  key={`${field.name}-sort-btn`}
                  label={'labelShort' in field ? field.labelShort : field.label}
                  value={field.name}
                  className="w-16"
                  current={sortBy}
                  onSelect={setSortBy}
                />
              ) : null,
            )}
          </div>
        </div>

        <div className="space-y-1">
          {displayedTasks.length === 0 ? (
            <EmptyState
              icon={
                <Icon
                  icon={search ? Search : LayoutList}
                  className={cn(IconSizeStyle.HW8, 'text-muted-foreground')}
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
                  <Button
                    onClick={() => openCreateDialog()}
                    variant="secondary"
                    className="mt-4"
                  >
                    Create First Task
                  </Button>
                )
              }
            />
          ) : (
            displayedTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}

          {hasDemoData && displayedTasks.length > 0 && (
            <div className="mt-12 pt-6 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive bg-destructive/10 hover:text-destructive hover:bg-destructive/15"
                onClick={deleteDemoData}
                data-testid="button-delete-demo-data"
              >
                Delete Demo Data
              </Button>
            </div>
          )}
        </div>
      </main>

      <Button
        onClick={() => openCreateDialog()}
        size="icon"
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground z-50 transition-transform active:scale-95 border-0"
        data-testid="button-create-task"
      >
        <Plus className={IconSizeStyle.HW6} />
      </Button>
    </div>
  )
}

export default Home
