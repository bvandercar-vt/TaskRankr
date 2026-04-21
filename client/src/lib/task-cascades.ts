/**
 * @fileoverview Pure helpers for task-tree cascades.
 *
 * All exports are side-effect-free: they take a flat task list and return a
 * new list (or a derived id set) without touching any state. Kept out of
 * `TasksProvider` so the provider file stays focused on state wiring
 * and so this logic is easier to unit-test in isolation.
 */

import {
  getById,
  getChildrenLatestCompletedAt,
  getDirectSubtasks,
  updateItem,
} from '@/lib/task-utils'
import { type Task, TaskStatus } from '~/shared/schema'

/**
 * BFS every descendant of `rootIds` through the `parentId` graph. Pass
 * `includeRoots: true` to also include the roots themselves (useful when the
 * caller wants a single "apply flag to subtree" set; leave it off when the
 * roots are being handled separately).
 */
export function collectSubtreeIds(
  tasks: Task[],
  rootIds: Iterable<number>,
  opts: { includeRoots?: boolean } = {},
): Set<number> {
  const result = new Set<number>()
  const rootSet = new Set(rootIds)
  if (opts.includeRoots) {
    rootSet.forEach((id) => result.add(id))
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

export interface ReconcileResult {
  tasks: Task[]
  corrections: { id: number; status: TaskStatus }[]
}

/**
 * Walks the tree until fixed point, auto-completing parents with
 * `inheritCompletionState` once all their children are completed and
 * auto-reverting them when any child is not completed. When a parent is
 * auto-completed and its grandparent has `autoHideCompleted`, cascades
 * `hidden: true` down the parent's subtree. Returns the reconciled tasks
 * plus the list of status corrections so callers can enqueue sync ops.
 */
export function reconcileInheritCompletionState(
  tasks: Task[],
): ReconcileResult {
  const corrections: { id: number; status: TaskStatus }[] = []
  let updated = tasks
  let changed = true

  while (changed) {
    changed = false
    const parents = updated.filter((t) => t.inheritCompletionState)
    for (const parent of parents) {
      const children = getDirectSubtasks(updated, parent.id)
      if (children.length === 0) continue

      const allChildrenCompleted = children.every(
        (c) => c.status === TaskStatus.COMPLETED,
      )

      if (allChildrenCompleted && parent.status !== TaskStatus.COMPLETED) {
        const latestCompletedAt = getChildrenLatestCompletedAt(children)

        const shouldHide = parent.parentId
          ? (getById(updated, parent.parentId)?.autoHideCompleted ?? false)
          : false

        updated = updateItem(updated, parent.id, (t) => ({
          ...t,
          status: TaskStatus.COMPLETED,
          completedAt: latestCompletedAt ?? new Date(),
          inProgressStartedAt: null,
          ...(shouldHide ? { hidden: true } : {}),
        }))

        if (shouldHide) {
          const toHide = collectSubtreeIds(updated, [parent.id])
          if (toHide.size > 0) {
            updated = updated.map((t) =>
              toHide.has(t.id) ? { ...t, hidden: true } : t,
            )
          }
        }

        corrections.push({ id: parent.id, status: TaskStatus.COMPLETED })
        changed = true
      } else if (
        !allChildrenCompleted &&
        parent.status === TaskStatus.COMPLETED
      ) {
        updated = updateItem(updated, parent.id, (t) => ({
          ...t,
          status: TaskStatus.OPEN,
          completedAt: null,
          inProgressStartedAt: null,
        }))
        corrections.push({ id: parent.id, status: TaskStatus.OPEN })
        changed = true
      }
    }
  }

  return { tasks: updated, corrections }
}

/**
 * Topologically orders a set of tasks so that any task with a parent in the
 * same recoverable set appears after that parent. Only traverses to parents
 * that are themselves in `recoverableIds` — never to parents that already
 * have a queued CREATE op (those resolve via the queue's own idMap at flush
 * time). Used when re-enqueuing orphaned negative-id creates.
 */
export function topoSortForRecovery(
  orphaned: Task[],
  taskById: Map<number, Task>,
  recoverableIds: Set<number>,
): Task[] {
  const sorted: Task[] = []
  const visited = new Set<number>()
  const visit = (t: Task) => {
    if (visited.has(t.id)) return
    visited.add(t.id)
    if (
      t.parentId != null &&
      t.parentId < 0 &&
      recoverableIds.has(t.parentId)
    ) {
      const parent = taskById.get(t.parentId)
      if (parent) visit(parent)
    }
    sorted.push(t)
  }
  for (const t of orphaned) visit(t)
  return sorted
}
