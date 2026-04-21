/**
 * @fileoverview In-memory draft session for the TaskForm dialog. Lets users
 * add subtasks, reassign parents, and reorder children mid-edit and have it
 * all commit atomically on Save or vanish on Cancel.
 *
 * Three layers are parked during an open session:
 *   - `draftTasks` — new tasks with negative ids; never persisted, never
 *     enqueued for sync.
 *   - `draftAssignedParents` — real-task id → draft parent id.
 *   - `draftSubtaskOrderOverrides` — real-parent id → subtaskOrder containing
 *     draft ids, kept out of the sync queue until commit.
 *
 * `tasksWithDrafts` overlays all three on top of `TasksProvider.tasks` so
 * the dialog subtree renders the in-progress tree like normal.
 *
 * Two contexts mirror the `TasksProvider` split:
 *   - `useDraftSession()` — reactive view (`tasksWithDrafts`, `draftTaskIds`,
 *     `draftAssignmentCount`, `hasDraftSession`, `isDraftId`).
 *   - `useDraftSessionMutations()` — stable draft-aware callbacks. They read
 *     draft state through refs so consumers that only fire mutations don't
 *     re-render on keystrokes that mutate `tasksWithDrafts`.
 *
 * Draft-aware mutators route by id: drafts stay in the layers above, real
 * ids fall through to the underlying `TasksProvider` mutators. Only the
 * dialog subtree sees these; everything else uses `useTaskMutations()`
 * directly and never knows drafts exist.
 *
 * On Save, `commitDraftSession` promotes drafts in dependency order — minting
 * real ids via `createTask`, then applying reorders and parent reassignments
 * through the real (draft-unaware) `TasksProvider` mutators. On Cancel,
 * `discardDraftSession` drops all three layers.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { omit } from 'es-toolkit'
import type { z } from 'zod'

import { debugLog } from '@/lib/debug-logger'
import { removeIds } from '@/lib/task-tree-utils'
import {
  type CreateTaskContent,
  type UpdateTaskContent,
  useTaskMutations,
  useTasks,
} from '@/providers/TasksProvider'
import {
  allRankFieldsNull,
  SubtaskSortMode,
  type Task,
  TaskStatus,
  taskSchema,
} from '~/shared/schema'

interface DraftSessionStateValue {
  /** `TasksProvider.tasks` merged with the in-memory draft overlay. */
  tasksWithDrafts: Task[]
  draftTaskIds: Set<number>
  /** Number of real tasks reassigned to a draft parent during the session. */
  draftAssignmentCount: number
  hasDraftSession: boolean
  isDraftId: (id: number) => boolean
}

interface DraftSessionMutationsValue {
  // Draft-aware mutators: route to the draft layer if the id is a draft,
  // otherwise fall through to the real TasksProvider mutator.
  updateTask: (id: number, updates: UpdateTaskContent) => Task
  deleteTask: (id: number) => void
  reorderSubtasks: (parentId: number, orderedIds: number[]) => void
  setTaskStatus: (id: number, status: TaskStatus) => Task

  // Session lifecycle
  createDraftTask: (data: CreateTaskContent) => Task
  assignDraftSubtask: (realTaskId: number, draftParentId: number) => void
  commitDraftSession: () => void
  discardDraftSession: () => void
}

const DraftSessionStateContext = createContext<DraftSessionStateValue | null>(
  null,
)
const DraftSessionMutationsContext =
  createContext<DraftSessionMutationsValue | null>(null)

export const DraftSessionProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const { tasks } = useTasks()
  const {
    createTask,
    updateTask: realUpdateTask,
    deleteTask: realDeleteTask,
    reorderSubtasks: realReorderSubtasks,
    setTaskStatus: realSetTaskStatus,
  } = useTaskMutations()
  // Keep refs to all reactive state read inside mutator callbacks so the
  // callbacks themselves can have empty deps and stay referentially stable
  // across draft churn. Mirrors `TasksProvider`'s tasksRef pattern.
  const tasksRef = useRef(tasks)
  tasksRef.current = tasks

  const [draftTasks, setDraftTasks] = useState<Task[]>([])
  // realTaskId -> draft parent id for the duration of the session.
  const [draftAssignedParents, setDraftAssignedParents] = useState<
    Map<number, number>
  >(new Map())
  // realParentId -> overridden subtaskOrder for the session
  const [draftSubtaskOrderOverrides, setDraftSubtaskOrderOverrides] = useState<
    Map<number, number[]>
  >(new Map())
  // Dedicated id ref for drafts so we don't burn or persist the real nextIdRef.
  // Drafts use very-negative IDs to avoid colliding with sync-pending temp ids.
  const draftIdRef = useRef(-100_000_000)

  const draftTasksRef = useRef(draftTasks)
  draftTasksRef.current = draftTasks
  const draftAssignedParentsRef = useRef(draftAssignedParents)
  draftAssignedParentsRef.current = draftAssignedParents
  const draftSubtaskOrderOverridesRef = useRef(draftSubtaskOrderOverrides)
  draftSubtaskOrderOverridesRef.current = draftSubtaskOrderOverrides

  const draftTaskIds = useMemo(
    () => new Set(draftTasks.map((t) => t.id)),
    [draftTasks],
  )
  const draftTaskIdsRef = useRef(draftTaskIds)
  draftTaskIdsRef.current = draftTaskIds
  /** Stable predicate that always reads the latest draft id set via ref. */
  const isDraftIdStable = useCallback(
    (id: number) => draftTaskIdsRef.current.has(id),
    [],
  )
  /** Reactive predicate exposed to state consumers (re-renders with set). */
  const isDraftId = useCallback(
    (id: number) => draftTaskIds.has(id),
    [draftTaskIds],
  )
  const hasDraftSession =
    draftTasks.length > 0 ||
    draftAssignedParents.size > 0 ||
    draftSubtaskOrderOverrides.size > 0

  const tasksWithDrafts = useMemo<Task[]>(() => {
    if (!hasDraftSession) return tasks

    // Index draft children by real parent so we can append them when no
    // explicit override is present.
    const draftChildrenByRealParent = new Map<number, number[]>()
    for (const d of draftTasks) {
      if (d.parentId != null && d.parentId >= 0) {
        const arr = draftChildrenByRealParent.get(d.parentId) ?? []
        arr.push(d.id)
        draftChildrenByRealParent.set(d.parentId, arr)
      }
    }

    // Single pass: apply assignment + order override + draft-children append.
    const merged = tasks.map((t) => {
      const newParentId = draftAssignedParents.get(t.id)
      const orderOverride = draftSubtaskOrderOverrides.get(t.id)
      const draftChildren = draftChildrenByRealParent.get(t.id)
      const shouldAppendDrafts =
        draftChildren != null &&
        orderOverride == null &&
        t.subtaskSortMode === SubtaskSortMode.MANUAL

      if (newParentId == null && orderOverride == null && !shouldAppendDrafts) {
        return t
      }
      return {
        ...t,
        ...(newParentId != null ? { parentId: newParentId } : {}),
        ...(orderOverride
          ? { subtaskOrder: orderOverride }
          : shouldAppendDrafts
            ? { subtaskOrder: [...t.subtaskOrder, ...draftChildren] }
            : {}),
      }
    })

    return [...merged, ...draftTasks]
  }, [
    hasDraftSession,
    tasks,
    draftTasks,
    draftAssignedParents,
    draftSubtaskOrderOverrides,
  ])

  // ---------------------------------------------------------------------------
  // Draft-layer primitives. All callbacks below have empty / stable-only deps
  // and read reactive draft state through refs, so the mutations context
  // value is stable across draft churn.
  // ---------------------------------------------------------------------------

  const createDraftTask = useCallback((data: CreateTaskContent): Task => {
    const tempId = draftIdRef.current--
    const newTask: Task = taskSchema.parse({
      ...allRankFieldsNull,
      ...data,
      id: tempId,
      userId: 'local',
      status: data.status ?? TaskStatus.OPEN,
    } satisfies z.input<typeof taskSchema>)

    setDraftTasks((prev) => {
      let updated = [...prev, newTask]
      if (data.parentId != null) {
        // If parent is itself a draft and MANUAL, append to its subtaskOrder.
        updated = updated.map((t) => {
          if (t.id !== data.parentId) return t
          if (t.subtaskSortMode === SubtaskSortMode.MANUAL) {
            return { ...t, subtaskOrder: [...t.subtaskOrder, tempId] }
          }
          return t
        })
      }
      return updated
    })
    debugLog.log('task', 'createDraft', {
      tempId,
      name: data.name,
      parentId: data.parentId,
    })
    return newTask
  }, [])

  const updateDraftTask = useCallback(
    (id: number, updates: UpdateTaskContent): Task => {
      let updated: Task | undefined
      setDraftTasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t
          updated = { ...t, ...updates }
          return updated
        }),
      )
      // biome-ignore lint/style/noNonNullAssertion: id was verified by caller as a draft
      return updated!
    },
    [],
  )

  const deleteDraftTask = useCallback((id: number) => {
    setDraftTasks((prev) => {
      const idsToDelete = new Set<number>()
      const collect = (pid: number) => {
        idsToDelete.add(pid)
        for (const t of prev) {
          if (t.parentId === pid) collect(t.id)
        }
      }
      collect(id)

      // Drop any assignment overrides whose new parent is being deleted.
      setDraftAssignedParents((prevAssigned) => {
        if (prevAssigned.size === 0) return prevAssigned
        let changed = false
        const next = new Map(prevAssigned)
        prevAssigned.forEach((newParentId, taskId) => {
          if (idsToDelete.has(newParentId)) {
            next.delete(taskId)
            changed = true
          }
        })
        return changed ? next : prevAssigned
      })

      // Drop overrides whose key (real parent) is being deleted, AND strip
      // deleted draft ids out of any remaining overrides whose key is still
      // alive (otherwise stale negative ids leak into commit and sync).
      setDraftSubtaskOrderOverrides((prevOverrides) => {
        if (prevOverrides.size === 0) return prevOverrides
        let changed = false
        const next = new Map(prevOverrides)
        prevOverrides.forEach((order, pid) => {
          if (idsToDelete.has(pid)) {
            next.delete(pid)
            changed = true
            return
          }
          const filtered = order.filter((sid) => !idsToDelete.has(sid))
          if (filtered.length !== order.length) {
            next.set(pid, filtered)
            changed = true
          }
        })
        return changed ? next : prevOverrides
      })

      return removeIds(prev, idsToDelete).map((t) => ({
        ...t,
        subtaskOrder: t.subtaskOrder.filter((sid) => !idsToDelete.has(sid)),
      }))
    })
    debugLog.log('task', 'deleteDraft', { id })
  }, [])

  const reorderDraftSubtasks = useCallback(
    (parentId: number, orderedIds: number[]) => {
      setDraftTasks((prev) =>
        prev.map((t) =>
          t.id === parentId ? { ...t, subtaskOrder: orderedIds } : t,
        ),
      )
    },
    [],
  )

  const assignDraftSubtask = useCallback(
    (realTaskId: number, draftParentId: number) => {
      setDraftAssignedParents((prev) => {
        const next = new Map(prev)
        next.set(realTaskId, draftParentId)
        return next
      })
      // If the draft parent is MANUAL, append the assigned task to its order.
      setDraftTasks((prev) =>
        prev.map((t) => {
          if (t.id !== draftParentId) return t
          if (t.subtaskSortMode !== SubtaskSortMode.MANUAL) return t
          if (t.subtaskOrder.includes(realTaskId)) return t
          return { ...t, subtaskOrder: [...t.subtaskOrder, realTaskId] }
        }),
      )
      debugLog.log('task', 'assignDraftSubtask', {
        realTaskId,
        draftParentId,
      })
    },
    [],
  )

  const discardDraftSession = useCallback(() => {
    setDraftTasks([])
    setDraftAssignedParents(new Map())
    setDraftSubtaskOrderOverrides(new Map())
    draftIdRef.current = -100_000_000
    debugLog.log('task', 'discardDraftSession', {})
  }, [])

  // ---------------------------------------------------------------------------
  // Draft-aware mutators exposed to dialog consumers. Route to the draft
  // layer if `id` is a draft, otherwise fall through to the underlying
  // TasksProvider mutator. All callbacks read draft state via refs so they
  // remain referentially stable across draft churn.
  // ---------------------------------------------------------------------------

  const updateTask = useCallback(
    (id: number, updates: UpdateTaskContent): Task => {
      if (isDraftIdStable(id)) return updateDraftTask(id, updates)
      return realUpdateTask(id, updates)
    },
    [isDraftIdStable, updateDraftTask, realUpdateTask],
  )

  const deleteTask = useCallback(
    (id: number) => {
      if (isDraftIdStable(id)) {
        deleteDraftTask(id)
        return
      }
      // A real delete cascades to descendants. Collect the full id set from
      // the current tasks snapshot so we can purge any draft assignments /
      // order overrides for the descendants too — otherwise stale entries
      // would produce bogus UPDATE/REORDER ops against non-existent ids on
      // commit.
      const snapshot = tasksRef.current
      const deletedIds = new Set<number>()
      const collect = (rootId: number) => {
        deletedIds.add(rootId)
        for (const t of snapshot) {
          if (t.parentId === rootId) collect(t.id)
        }
      }
      collect(id)

      setDraftAssignedParents((prev) => {
        if (prev.size === 0) return prev
        let changed = false
        const next = new Map(prev)
        prev.forEach((_newParentId, taskId) => {
          if (deletedIds.has(taskId)) {
            next.delete(taskId)
            changed = true
          }
        })
        return changed ? next : prev
      })
      setDraftSubtaskOrderOverrides((prev) => {
        if (prev.size === 0) return prev
        let changed = false
        const next = new Map(prev)
        prev.forEach((order, pid) => {
          if (deletedIds.has(pid)) {
            next.delete(pid)
            changed = true
            return
          }
          const filtered = order.filter((sid) => !deletedIds.has(sid))
          if (filtered.length !== order.length) {
            next.set(pid, filtered)
            changed = true
          }
        })
        return changed ? next : prev
      })

      realDeleteTask(id)
    },
    [isDraftIdStable, deleteDraftTask, realDeleteTask],
  )

  const reorderSubtasks = useCallback(
    (parentId: number, orderedIds: number[]) => {
      if (isDraftIdStable(parentId)) {
        reorderDraftSubtasks(parentId, orderedIds)
        return
      }
      // Real parent: if any draft children/assignments are involved (i.e. we
      // are inside a draft session), park the new order in the override map
      // so it is not persisted/synced until commit. Otherwise, reorder
      // normally via the real mutator.
      const assigned = draftAssignedParentsRef.current
      const overrides = draftSubtaskOrderOverridesRef.current
      const drafts = draftTasksRef.current
      const inSession =
        drafts.length > 0 || assigned.size > 0 || overrides.size > 0
      if (
        inSession &&
        orderedIds.some((id) => isDraftIdStable(id) || assigned.has(id))
      ) {
        setDraftSubtaskOrderOverrides((prev) => {
          const next = new Map(prev)
          next.set(parentId, orderedIds)
          return next
        })
        debugLog.log('task', 'reorderSubtasks:draftOverride', {
          parentId,
          orderedIds,
        })
        return
      }
      realReorderSubtasks(parentId, orderedIds)
    },
    [isDraftIdStable, reorderDraftSubtasks, realReorderSubtasks],
  )

  const setTaskStatus = useCallback(
    (id: number, status: TaskStatus): Task => {
      if (isDraftIdStable(id)) {
        const next: Partial<Task> =
          status === TaskStatus.IN_PROGRESS
            ? { status, inProgressStartedAt: new Date() }
            : status === TaskStatus.COMPLETED
              ? {
                  status,
                  completedAt: new Date(),
                  inProgressStartedAt: null,
                }
              : { status, inProgressStartedAt: null }
        return updateDraftTask(id, next as UpdateTaskContent)
      }
      return realSetTaskStatus(id, status)
    },
    [isDraftIdStable, updateDraftTask, realSetTaskStatus],
  )

  // ---------------------------------------------------------------------------
  // commitDraftSession: promote all in-memory drafts to real tasks.
  //
  // `draftTasks` is already in topological order by construction: a draft
  // child cannot exist until its draft parent has been created (you have to
  // navigate into the parent draft to add a subtask). We replay through
  // `createTask`, mapping draft.id -> real.id so children resolve their
  // parentId from the freshly minted real id. Reorders and assignments then
  // go through the *real* mutators from TasksProvider — which are now
  // draft-unaware after the draft split — so no re-parking into the draft
  // layer is possible.
  //
  // Reads draft state via refs so the callback stays stable across draft
  // churn (consumers of `useDraftSessionMutations` don't re-render).
  // ---------------------------------------------------------------------------
  const commitDraftSession = useCallback(() => {
    const drafts = draftTasksRef.current
    const assignments = draftAssignedParentsRef.current
    const overrides = draftSubtaskOrderOverridesRef.current

    if (drafts.length === 0 && assignments.size === 0 && overrides.size === 0) {
      return
    }

    debugLog.log('task', 'commitDraftSession:start', {
      draftCount: drafts.length,
      assignmentCount: assignments.size,
      overrideCount: overrides.size,
    })

    const idMap = new Map<number, number>()
    const resolve = (id: number) => idMap.get(id) ?? id

    for (const draft of drafts) {
      const created = createTask({
        ...omit(draft, ['id', 'userId']),
        parentId: draft.parentId != null ? resolve(draft.parentId) : null,
      })
      idMap.set(draft.id, created.id)
    }

    // For MANUAL draft parents whose user-defined order differs from the
    // append-order produced by sequential createTask calls, lock in the order.
    for (const draft of drafts) {
      if (draft.subtaskSortMode !== SubtaskSortMode.MANUAL) continue
      if (draft.subtaskOrder.length === 0) continue
      const realId = resolve(draft.id)
      const resolvedOrder = draft.subtaskOrder.map(resolve)
      realReorderSubtasks(realId, resolvedOrder)
    }

    // Apply assignments: real task -> resolved (draft) parent.
    assignments.forEach((newParentId, realTaskId) => {
      realUpdateTask(realTaskId, { parentId: resolve(newParentId) })
    })

    // Apply real-parent subtaskOrder overrides (resolving any draft ids).
    overrides.forEach((order, realParentId) => {
      realReorderSubtasks(realParentId, order.map(resolve))
    })

    discardDraftSession()
    debugLog.log('task', 'commitDraftSession:complete', { mapped: idMap.size })
  }, [createTask, realUpdateTask, realReorderSubtasks, discardDraftSession])

  const stateValue = useMemo<DraftSessionStateValue>(
    () => ({
      tasksWithDrafts,
      draftTaskIds,
      draftAssignmentCount: draftAssignedParents.size,
      hasDraftSession,
      isDraftId,
    }),
    [
      tasksWithDrafts,
      draftTaskIds,
      draftAssignedParents.size,
      hasDraftSession,
      isDraftId,
    ],
  )

  const mutationsValue = useMemo<DraftSessionMutationsValue>(
    () => ({
      updateTask,
      deleteTask,
      reorderSubtasks,
      setTaskStatus,
      createDraftTask,
      assignDraftSubtask,
      commitDraftSession,
      discardDraftSession,
    }),
    [
      updateTask,
      deleteTask,
      reorderSubtasks,
      setTaskStatus,
      createDraftTask,
      assignDraftSubtask,
      commitDraftSession,
      discardDraftSession,
    ],
  )

  return (
    <DraftSessionMutationsContext.Provider value={mutationsValue}>
      <DraftSessionStateContext.Provider value={stateValue}>
        {children}
      </DraftSessionStateContext.Provider>
    </DraftSessionMutationsContext.Provider>
  )
}

export const useDraftSession = () => {
  const ctx = useContext(DraftSessionStateContext)
  if (!ctx)
    throw new Error(
      'useDraftSession must be used within a DraftSessionProvider',
    )
  return ctx
}

export const useDraftSessionMutations = () => {
  const ctx = useContext(DraftSessionMutationsContext)
  if (!ctx)
    throw new Error(
      'useDraftSessionMutations must be used within a DraftSessionProvider',
    )
  return ctx
}
