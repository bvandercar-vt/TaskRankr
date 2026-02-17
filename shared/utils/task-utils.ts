import { type Task, TaskStatus } from '../schema'

export const getTaskById = (allTasks: Task[], id: number): Task | undefined =>
  allTasks.find((task) => task.id === id)

export const getDirectSubtasks = (allTasks: Task[], id: number): Task[] =>
  allTasks.filter((task) => task.parentId === id)

export const getAllDescendantIds = (
  allTasks: Task[],
  taskId: number,
): Set<number> => {
  const ids = new Set<number>()
  const walk = (id: number) => {
    ids.add(id)
    for (const t of allTasks) {
      if (t.parentId === id) walk(t.id)
    }
  }
  walk(taskId)
  return ids
}

export const getTaskStatuses = (task: Task) => ({
  isInProgress: task.status === TaskStatus.IN_PROGRESS,
  isPinned: task.status === TaskStatus.PINNED,
  isCompleted: task.status === TaskStatus.COMPLETED,
})

export const getHasIncomplete = (tasks: Task[]): boolean =>
  tasks.some((t) => t.status !== TaskStatus.COMPLETED)

export const getHasIncompleteSubtasks = (
  allTasks: Task[],
  taskId: number,
): boolean => getHasIncomplete(getDirectSubtasks(allTasks, taskId))
