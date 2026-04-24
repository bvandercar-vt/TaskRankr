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
 * Derived predicate: true iff `task` is hidden purely because its parent has
 * `autoHideCompleted` enabled and the task is COMPLETED. Pass `undefined`
 * for `parent` when the task has no parent. The task's own `hidden` flag is
 * intentionally ignored here — this predicate isolates the parent-driven
 * auto-hide signal, e.g. so the UI can disable the per-task hide toggle.
 */
export const isAutoHiddenByParent = (
  task: Pick<Task, 'status'>,
  parent: Pick<Task, 'autoHideCompleted'> | undefined,
): boolean =>
  parent?.autoHideCompleted === true && task.status === TaskStatus.COMPLETED

/**
 * Derived predicate: true iff `task` should be considered hidden in the UI,
 * accounting for both the user-set `hidden` flag and parent-driven auto-hide.
 * Pass `undefined` for `parent` when the task has no parent.
 */
export const isEffectivelyHidden = (
  task: Pick<Task, 'hidden' | 'status'>,
  parent: Pick<Task, 'autoHideCompleted'> | undefined,
): boolean => task.hidden || isAutoHiddenByParent(task, parent)

/**
 * Translates a target `TaskStatus` into the timestamp side-effects that
 * accompany the transition: starting `IN_PROGRESS` stamps
 * `inProgressStartedAt` and clears any prior `completedAt`; transitioning
 * to `COMPLETED` stamps `completedAt` and clears the in-progress timer;
 * transitioning to any other status clears both timestamps.
 */
export const statusToStatusPatch = (
  status: TaskStatus,
): Pick<Task, 'status' | 'inProgressStartedAt' | 'completedAt'> => {
  switch (status) {
    case TaskStatus.IN_PROGRESS:
      return {
        status,
        inProgressStartedAt: new Date(),
        completedAt: null,
      }
    case TaskStatus.COMPLETED:
      return {
        status,
        completedAt: new Date(),
        inProgressStartedAt: null,
      }
    case TaskStatus.PINNED:
    case TaskStatus.OPEN:
      return {
        status,
        inProgressStartedAt: null,
        completedAt: null,
      }
    default:
      throw new Error(`Unhandled status: ${status satisfies never}`)
  }
}

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
