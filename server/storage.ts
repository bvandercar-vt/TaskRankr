/**
 * @fileoverview Database access layer implementing the IStorage interface.
 *
 * Provides CRUD operations for tasks and user settings using Drizzle ORM.
 * Handles task status transitions including in-progress time tracking,
 * cascading status changes to subtasks, and recursive task deletion.
 */

import { and, eq } from 'drizzle-orm'

import {
  type InsertTask,
  type Task,
  TaskStatus,
  tasks,
  type UpdateTask,
  type UserSettings,
  userSettings,
} from '~/shared/schema'
import { getHasIncomplete } from '~/shared/utils/task-utils'
import { db } from './db'

type UpdateTaskArg = Omit<UpdateTask, 'id'>

export interface IStorage {
  getTasks(userId: string): Promise<Task[]>
  getTask(id: number, userId: string): Promise<Task | undefined>
  createTask(task: InsertTask): Promise<Task>
  updateTask(id: number, userId: string, updates: UpdateTaskArg): Promise<Task>
  deleteTask(id: number, userId: string): Promise<void>
  setTaskStatus(
    id: number,
    userId: string,
    newStatus: TaskStatus,
  ): Promise<Task>
  reorderSubtasks(
    parentId: number,
    userId: string,
    orderedIds: number[],
  ): Promise<void>
  getSettings(userId: string): Promise<UserSettings>
  updateSettings(
    userId: string,
    updates: Partial<UserSettings>,
  ): Promise<UserSettings>
}

export class DatabaseStorage implements IStorage {
  async getTasks(userId: string): Promise<Task[]> {
    const result = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(tasks.id)

    const byId = new Map(result.map((t) => [t.id, t]))
    const fixes: { id: number; subtaskOrder: number[] }[] = []

    for (const task of result) {
      if (task.parentId == null) continue
      const parent = byId.get(task.parentId)
      if (!parent) continue
      if (!parent.subtaskOrder.includes(task.id)) {
        parent.subtaskOrder = [...parent.subtaskOrder, task.id]
        fixes.push({ id: parent.id, subtaskOrder: parent.subtaskOrder })
      }
    }

    if (fixes.length > 0) {
      await Promise.all(
        fixes.map(({ id, subtaskOrder }) =>
          db
            .update(tasks)
            .set({ subtaskOrder })
            .where(and(eq(tasks.id, id), eq(tasks.userId, userId))),
        ),
      )
    }

    return result
  }

  async getTask(id: number, userId: string): Promise<Task | undefined> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    return task
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning()
    const created = task

    if (created.parentId && created.status !== TaskStatus.COMPLETED) {
      await this.revertParentIfInheritCompletionState(
        created.parentId,
        created.userId,
      )
    }

    return created
  }

  async setTaskStatus(
    id: number,
    userId: string,
    newStatus: TaskStatus,
  ): Promise<Task> {
    const currentTask = await this.getTask(id, userId)
    if (!currentTask) {
      throw new Error('Task not found')
    }

    const oldStatus = currentTask.status
    if (oldStatus === newStatus) {
      return currentTask
    }

    if (newStatus === TaskStatus.COMPLETED) {
      const children = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.parentId, id), eq(tasks.userId, userId)))
      if (getHasIncomplete(children)) {
        throw new Error('All subtasks must be completed first')
      }
    }

    const updates: Partial<InsertTask> & { completedAt?: Date | null } = {
      status: newStatus,
    }

    // Handle status transitions
    if (
      newStatus === TaskStatus.IN_PROGRESS &&
      oldStatus !== TaskStatus.IN_PROGRESS
    ) {
      // Starting in-progress: demote current in_progress task to pinned
      const allTasks = await this.getTasks(userId)
      const currentInProgressTask = allTasks.find(
        (t) => t.status === TaskStatus.IN_PROGRESS && t.id !== id,
      )
      if (currentInProgressTask) {
        // Stop timer on old in-progress task and set to pinned
        const elapsed = currentInProgressTask.inProgressStartedAt
          ? Date.now() - currentInProgressTask.inProgressStartedAt.getTime()
          : 0
        await db
          .update(tasks)
          .set({
            status: TaskStatus.PINNED,
            inProgressTime: currentInProgressTask.inProgressTime + elapsed,
            inProgressStartedAt: null,
          })
          .where(eq(tasks.id, currentInProgressTask.id))
      }
      // Start timer on new in-progress task
      updates.inProgressStartedAt = new Date()
    }

    if (
      oldStatus === TaskStatus.IN_PROGRESS &&
      newStatus !== TaskStatus.IN_PROGRESS &&
      currentTask.inProgressStartedAt
    ) {
      // Leaving in-progress: accumulate time
      const elapsed = Date.now() - currentTask.inProgressStartedAt.getTime()
      updates.inProgressTime = currentTask.inProgressTime + elapsed
      updates.inProgressStartedAt = null
    }

    if (newStatus === TaskStatus.COMPLETED) {
      updates.completedAt = new Date()

      if (currentTask.parentId) {
        const parent = await this.getTask(currentTask.parentId, userId)
        if (parent?.autoHideCompleted) {
          updates.hidden = true
        }
      }
    }

    if (
      oldStatus === TaskStatus.COMPLETED &&
      newStatus !== TaskStatus.COMPLETED
    ) {
      updates.completedAt = null
    }

    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning()

    // Cascade status to children for completed/restored
    if (
      newStatus === TaskStatus.COMPLETED ||
      (oldStatus === TaskStatus.COMPLETED && newStatus === TaskStatus.OPEN)
    ) {
      const childTasks = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.parentId, id), eq(tasks.userId, userId)))
      for (const child of childTasks) {
        await this.setTaskStatus(child.id, userId, newStatus)
      }
    }

    if (newStatus === TaskStatus.COMPLETED && currentTask.parentId) {
      await this.checkInheritCompletionState(currentTask.parentId, userId, id)
    }

    return task
  }

  private async checkInheritCompletionState(
    parentId: number,
    userId: string,
    justCompletedChildId: number,
  ): Promise<void> {
    const parent = await this.getTask(parentId, userId)
    if (
      !parent ||
      !parent.inheritCompletionState ||
      parent.status === TaskStatus.COMPLETED
    ) {
      return
    }

    const children = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.parentId, parentId), eq(tasks.userId, userId)))

    const allCompleted = children.every(
      (t) => t.id === justCompletedChildId || t.status === TaskStatus.COMPLETED,
    )

    if (allCompleted) {
      const completionUpdate: Partial<InsertTask> & {
        completedAt?: Date | null
      } = {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        inProgressStartedAt: null,
      }

      if (parent.parentId) {
        const grandparent = await this.getTask(parent.parentId, userId)
        if (grandparent?.autoHideCompleted) {
          completionUpdate.hidden = true
        }
      }

      await db
        .update(tasks)
        .set(completionUpdate)
        .where(eq(tasks.id, parentId))

      if (parent.parentId) {
        await this.checkInheritCompletionState(parent.parentId, userId, parentId)
      }
    }
  }

  private async revertParentIfInheritCompletionState(
    parentId: number,
    userId: string,
  ): Promise<void> {
    const parent = await this.getTask(parentId, userId)
    if (
      !parent ||
      !parent.inheritCompletionState ||
      parent.status !== TaskStatus.COMPLETED
    ) {
      return
    }

    await db
      .update(tasks)
      .set({
        status: TaskStatus.OPEN,
        completedAt: null,
        inProgressStartedAt: null,
      })
      .where(eq(tasks.id, parentId))
  }

  async updateTask(
    id: number,
    userId: string,
    updates: UpdateTaskArg,
  ): Promise<Task> {
    const finalUpdates = { ...updates }
    if (finalUpdates.parentId === null) {
      finalUpdates.hidden = false
    }

    const [task] = await db
      .update(tasks)
      .set(finalUpdates)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning()

    const updated = task

    if (finalUpdates.autoHideCompleted !== undefined) {
      await db
        .update(tasks)
        .set({ hidden: finalUpdates.autoHideCompleted })
        .where(
          and(
            eq(tasks.parentId, id),
            eq(tasks.userId, userId),
            eq(tasks.status, TaskStatus.COMPLETED),
          ),
        )
    }

    if (
      finalUpdates.inheritCompletionState === true &&
      updated.status === TaskStatus.COMPLETED
    ) {
      const children = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.parentId, id), eq(tasks.userId, userId)))
      if (getHasIncomplete(children)) {
        const [reverted] = await db
          .update(tasks)
          .set({
            status: TaskStatus.OPEN,
            completedAt: null,
            inProgressStartedAt: null,
          })
          .where(eq(tasks.id, id))
          .returning()
        return reverted
      }
    }

    if (
      finalUpdates.parentId != null &&
      updated.status !== TaskStatus.COMPLETED
    ) {
      await this.revertParentIfInheritCompletionState(
        finalUpdates.parentId,
        userId,
      )
    }

    return updated
  }

  private async getTotalTimeForTask(
    id: number,
    userId: string,
  ): Promise<number> {
    const task = await this.getTask(id, userId)
    if (!task) return 0

    let total = task.inProgressTime

    const childTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.parentId, id), eq(tasks.userId, userId)))

    for (const child of childTasks) {
      total += await this.getTotalTimeForTask(child.id, userId)
    }

    return total
  }

  async deleteTask(id: number, userId: string): Promise<void> {
    const taskToDelete = await this.getTask(id, userId)
    if (!taskToDelete) return

    if (taskToDelete.parentId) {
      const parent = await this.getTask(taskToDelete.parentId, userId)
      if (parent) {
        const timeToAccumulate = await this.getTotalTimeForTask(id, userId)
        const updates: Partial<InsertTask> = {
          subtaskOrder: parent.subtaskOrder.filter((sid: number) => sid !== id),
        }
        if (timeToAccumulate > 0) {
          updates.inProgressTime = parent.inProgressTime + timeToAccumulate
        }
        await db
          .update(tasks)
          .set(updates)
          .where(
            and(eq(tasks.id, taskToDelete.parentId), eq(tasks.userId, userId)),
          )
      }
    }

    const childTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.parentId, id), eq(tasks.userId, userId)))
    for (const child of childTasks) {
      await this.deleteTaskWithoutTimeAccumulation(child.id, userId)
    }

    await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
  }

  private async deleteTaskWithoutTimeAccumulation(
    id: number,
    userId: string,
  ): Promise<void> {
    const childTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.parentId, id), eq(tasks.userId, userId)))
    for (const child of childTasks) {
      await this.deleteTaskWithoutTimeAccumulation(child.id, userId)
    }

    await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
  }

  async reorderSubtasks(
    parentId: number,
    userId: string,
    orderedIds: number[],
  ): Promise<void> {
    await db
      .update(tasks)
      .set({ subtaskOrder: orderedIds })
      .where(and(eq(tasks.id, parentId), eq(tasks.userId, userId)))
  }

  async getSettings(userId: string): Promise<UserSettings> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
    if (settings) {
      return settings
    }
    // Create default settings for new user
    const [newSettings] = await db
      .insert(userSettings)
      .values({ userId })
      .returning()
    return newSettings
  }

  async updateSettings(
    userId: string,
    updates: Partial<UserSettings>,
  ): Promise<UserSettings> {
    // Ensure settings exist first
    await this.getSettings(userId)

    const { userId: _, ...updateData } = updates
    const [settings] = await db
      .update(userSettings)
      .set(updateData)
      .where(eq(userSettings.userId, userId))
      .returning()
    return settings
  }
}

export const storage = new DatabaseStorage()
