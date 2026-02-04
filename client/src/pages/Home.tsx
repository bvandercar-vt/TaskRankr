/**
 * @fileoverview Main task list (tree) page with sorting and filtering
 * capabilities.
 *
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  HelpCircle,
  LayoutList,
  LogIn,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  X,
} from 'lucide-react'
import { Link } from 'wouter'

import { EmptyState, PageError, PageLoading } from '@/components/page-states'
import { Button } from '@/components/primitives/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/primitives/DropdownMenu'
import { Input } from '@/components/primitives/forms/Input'
import { Icon } from '@/components/primitives/LucideIcon'
import { TaskCard } from '@/components/TaskCard'
import { useTaskDialog } from '@/components/TaskDialogProvider'
import { useGuestModeState } from '@/hooks/useGuestModeState'
import { getIsVisible, useSettings } from '@/hooks/useSettings'
import { useTasks } from '@/hooks/useTasks'
import { IconSizeStyle } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { authPaths } from '~/shared/constants'
import {
  type Ease,
  type Enjoyment,
  type Priority,
  RANK_FIELDS_CRITERIA,
  type SortOption,
  type TaskResponse,
  type Time,
} from '~/shared/schema'

const HOW_TO_USE_BANNER_KEY = 'taskrankr-how-to-use-dismissed'

const HowToUseBanner = () => {
  const [isDismissed, setIsDismissed] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const dismissed = localStorage.getItem(HOW_TO_USE_BANNER_KEY) === 'true'
        setIsDismissed(dismissed)
      }
    } catch {
      setIsDismissed(true)
    }
    setHasLoaded(true)
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(HOW_TO_USE_BANNER_KEY, 'true')
    } catch {
      // noop
    }
    setIsDismissed(true)
  }

  if (!hasLoaded || isDismissed) return null

  return (
    <div
      className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 mb-4 flex items-center justify-between gap-3"
      data-testid="banner-how-to-use"
    >
      <div className="flex items-center gap-3 min-w-0">
        <HelpCircle
          className={cn(IconSizeStyle.HW5, 'shrink-0 text-primary')}
        />
        <span className="text-sm text-foreground">
          New here?{' '}
          <Link href="/how-to-use">
            <span
              className="text-primary underline underline-offset-2 cursor-pointer"
              data-testid="link-how-to-use-banner"
            >
              Learn how to use the app
            </span>
          </Link>
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={dismiss}
        data-testid="button-dismiss-how-to-use"
      >
        <X className={IconSizeStyle.HW4} />
      </Button>
    </div>
  )
}

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

const LEVEL_WEIGHTS = {
  highest: 5,
  hardest: 5,
  high: 4,
  hard: 4,
  medium: 3,
  low: 2,
  easy: 2,
  lowest: 1,
  easiest: 1,
  none: 0,
} as const satisfies Record<Priority | Ease | Enjoyment | Time, number>

const getLevelWeight = (
  level: keyof typeof LEVEL_WEIGHTS | null | undefined,
): number => (level ? (LEVEL_WEIGHTS[level] ?? 0) : 0)

const SORT_DIRECTIONS: Record<string, 'asc' | 'desc'> = {
  date: 'desc',
  priority: 'desc',
  ease: 'asc',
  enjoyment: 'desc',
  time: 'asc',
}

const Home = () => {
  const { data: tasks, isLoading, error } = useTasks()
  const { openCreateDialog } = useTaskDialog()
  const { settings, updateSetting } = useSettings()
  const { isGuestMode, exitGuestMode, hasDemoData, deleteDemoData } =
    useGuestModeState()
  const [search, setSearch] = useState('')
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)

  const sortBy = settings.sortBy
  const setSortBy = (value: SortOption) => updateSetting('sortBy', value)

  // Sort function for tasks
  const sortTasks = useCallback(
    (theseTasks: TaskResponse[], sort: SortOption): TaskResponse[] => {
      const sorted = [...theseTasks]
      if (sort === 'date') {
        sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime()
          const dateB = new Date(b.createdAt).getTime()
          return dateB - dateA
        })
      } else {
        sorted.sort((a, b) => {
          const direction = SORT_DIRECTIONS[sort] || 'desc'
          const valA = getLevelWeight(a[sort])
          const valB = getLevelWeight(b[sort])

          if (valA !== valB) {
            return direction === 'desc' ? valB - valA : valA - valB
          }

          const pA = getLevelWeight(a.priority)
          const pB = getLevelWeight(b.priority)
          const eA = getLevelWeight(a.ease)
          const eB = getLevelWeight(b.ease)
          const jA = getLevelWeight(a.enjoyment)
          const jB = getLevelWeight(b.enjoyment)

          if (sort === 'priority') {
            if (eA !== eB) return eA - eB
            return jB - jA
          }
          if (sort === 'ease') {
            if (pA !== pB) return pB - pA
            return jB - jA
          }
          if (sort === 'enjoyment') {
            if (pA !== pB) return pB - pA
            return eA - eB
          }
          if (sort === 'time') {
            if (pA !== pB) return pB - pA
            if (eA !== eB) return eA - eB
            return pB - pA
          }
          return 0
        })
      }
      return sorted
    },
    [],
  )

  // Recursive function to filter task tree
  const filterAndSortTree = useCallback(
    (nodes: TaskResponse[], term: string, sort: SortOption): TaskResponse[] => {
      const result = nodes.reduce((acc: TaskResponse[], node) => {
        const matches = node.name.toLowerCase().includes(term.toLowerCase())
        const filteredSubtasks = node.subtasks
          ? filterAndSortTree(node.subtasks, term, sort)
          : []

        if (matches || filteredSubtasks.length > 0) {
          acc.push({ ...node, subtasks: filteredSubtasks })
        }
        return acc
      }, [])

      return sortTasks(result, sort)
    },
    [sortTasks],
  )

  // Build tree from flat list, excluding completed tasks
  // Also extract in-progress and pending tasks to be hoisted to top
  const { taskTree, pinnedTasks } = useMemo(() => {
    if (!tasks) return { taskTree: [], pinnedTasks: [] }

    // Filter out completed tasks
    const activeTasks = tasks.filter((task) => task.status !== 'completed')

    // Collect pinned tasks (in_progress first, then pinned) to display at top
    const pinnedTaskIds = new Set<number>()
    const inProgressList: TaskResponse[] = []
    const pinnedList: TaskResponse[] = []

    activeTasks.forEach((task) => {
      if (task.status === 'in_progress') {
        pinnedTaskIds.add(task.id)
        inProgressList.push({ ...task, subtasks: [] } as TaskResponse)
      } else if (task.status === 'pinned') {
        pinnedTaskIds.add(task.id)
        pinnedList.push({ ...task, subtasks: [] } as TaskResponse)
      }
    })

    // Hoisted order: in_progress first, then pinned
    const hoistedList = [...inProgressList, ...pinnedList]

    const nodes: Record<number, TaskResponse> = {}
    const roots: TaskResponse[] = []

    activeTasks.forEach((task) => {
      if (pinnedTaskIds.has(task.id)) return
      nodes[task.id] = { ...task, subtasks: [] } as TaskResponse
    })

    activeTasks.forEach((task) => {
      if (pinnedTaskIds.has(task.id)) return

      // If parent is pinned, treat as root level
      if (task.parentId && nodes[task.parentId]) {
        nodes[task.parentId].subtasks?.push(nodes[task.id])
      } else if (!task.parentId || !pinnedTaskIds.has(task.parentId)) {
        roots.push(nodes[task.id])
      } else {
        // Parent is pinned, so this becomes a root
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
      (t) => t.status === 'in_progress',
    )
    const pinnedOnly = filteredPinned.filter((t) => t.status === 'pinned')

    // Sort pinned: by priority first if setting enabled, then by current sort as secondary
    let sortedPinned: TaskResponse[]
    if (settings.alwaysSortPinnedByPriority && sortBy !== 'priority') {
      // Sort by priority first, with current sortBy as secondary
      sortedPinned = [...pinnedOnly].sort((a, b) => {
        const pA = getLevelWeight(a.priority)
        const pB = getLevelWeight(b.priority)
        if (pA !== pB) return pB - pA // Priority descending

        // Secondary sort by current sortBy
        if (sortBy === 'date') {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        }
        const direction = SORT_DIRECTIONS[sortBy] || 'desc'
        const valA = getLevelWeight(a[sortBy])
        const valB = getLevelWeight(b[sortBy])
        return direction === 'desc' ? valB - valA : valA - valB
      })
    } else {
      sortedPinned = sortTasks(pinnedOnly, sortBy)
    }

    // Combine: in_progress first, then sorted pinned, then sorted tree
    return [...inProgressTask, ...sortedPinned, ...sortedTree]
  }, [
    taskTree,
    pinnedTasks,
    search,
    sortBy,
    sortTasks,
    filterAndSortTree,
    settings,
  ])

  if (isLoading) return <PageLoading />
  if (error) return <PageError />

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <main className="max-w-5xl mx-auto px-2 sm:px-4 py-8">
        <HowToUseBanner />
        <div className="flex items-center justify-between mb-4 pr-2">
          {/* Hamburger Menu */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  data-testid="button-menu"
                >
                  <Menu className={IconSizeStyle.HW5} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="bg-card border-white/10 w-48"
              >
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                  data-testid="menu-item-search"
                >
                  <Search className={cn(IconSizeStyle.HW4, 'mr-2')} />
                  Search
                </DropdownMenuItem>
                <Link href="/completed">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    data-testid="menu-item-completed"
                  >
                    <CheckCircle2 className={cn(IconSizeStyle.HW4, 'mr-2')} />
                    Completed Tasks
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    data-testid="menu-item-settings"
                  >
                    <Settings className={cn(IconSizeStyle.HW4, 'mr-2')} />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <Link href="/how-to-use">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    data-testid="menu-item-how-to-use"
                  >
                    <HelpCircle className={cn(IconSizeStyle.HW4, 'mr-2')} />
                    How To Use
                  </DropdownMenuItem>
                </Link>
                {isGuestMode && (
                  <>
                    <DropdownMenuSeparator />
                    <a href={authPaths.login}>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        data-testid="menu-item-signup"
                      >
                        <LogIn className={cn(IconSizeStyle.HW4, 'mr-2')} />
                        Sign Up
                      </DropdownMenuItem>
                    </a>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={exitGuestMode}
                      data-testid="menu-item-exit-guest"
                    >
                      <LogOut className={cn(IconSizeStyle.HW4, 'mr-2')} />
                      Exit Guest Mode
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

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
              value="date"
              className="min-w-12 max-w-16"
              current={sortBy}
              onSelect={setSortBy}
            />
            {RANK_FIELDS_CRITERIA.map((field) =>
              getIsVisible(field.name, settings) ? (
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
            <div className="mt-8 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
