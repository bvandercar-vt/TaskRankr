import { type Task, TaskStatus } from '../schema'

export * from './id-list-utils'

export const getDirectSubtasks = (allTasks: Task[], id: number): Task[] =>
  allTasks.filter((task) => task.parentId === id)

/**
 * Collects every descendant of `rootIds` through the `parentId` graph. Pass
 * `includeRoots: true` to also include the roots themselves.
 */
export const collectDescendantIds = (
  tasks: Task[],
  rootIds: Iterable<number>,
  opts: { includeRoots?: boolean } = {},
): Set<number> => {
  const result = new Set<number>()
  const rootSet = new Set(rootIds)
  if (opts.includeRoots) {
    rootSet.forEach((id) => {
      result.add(id)
    })
  }
  let frontier: Set<number> = rootSet
  while (frontier.size > 0) {
    const next = new Set<number>()
    for (const t of tasks) {
      if (
        t.parentId !== null &&
        frontier.has(t.parentId) &&
        !result.has(t.id)
      ) {
        result.add(t.id)
        next.add(t.id)
      }
    }
    frontier = next
  }
  return result
}

export const getTaskStatuses = (task: Pick<Task, 'status'>) => ({
  isInProgress: task.status === TaskStatus.IN_PROGRESS,
  isPinned: task.status === TaskStatus.PINNED,
  isCompleted: task.status === TaskStatus.COMPLETED,
})

/**
 * Predicate for the "auto-hide completed" rule: a task should be hidden
 * when it transitions to (or is created as) COMPLETED and its parent has
 * `autoHideCompleted` enabled. Pass `undefined` for `parent` when the task
 * has no parent.
 */
export const shouldAutoHideUnderParent = (
  parent: Pick<Task, 'autoHideCompleted'> | undefined,
  status: TaskStatus,
): boolean =>
  parent?.autoHideCompleted === true && status === TaskStatus.COMPLETED

export const getHasIncomplete = (tasks: Task[]): boolean =>
  tasks.some((t) => t.status !== TaskStatus.COMPLETED)

export const getHasIncompleteSubtasks = (
  allTasks: Task[],
  taskId: number,
): boolean => getHasIncomplete(getDirectSubtasks(allTasks, taskId))

export const getChildrenLatestCompletedAt = (children: Task[]): Date | null =>
  children.reduce<Date | null>((latest, c) => {
    const completedAt = c.completedAt ? new Date(c.completedAt) : null
    if (!completedAt) return latest
    if (!latest) return completedAt
    return completedAt > latest ? completedAt : latest
  }, null)
