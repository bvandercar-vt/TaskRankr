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
  type TaskStatus,
  tasks,
  type UpdateTask,
  type UserSettings,
  userSettings,
} from '~/shared/schema'
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
    return result as Task[]
  }

  async getTask(id: number, userId: string): Promise<Task | undefined> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    return task as Task | undefined
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning()
    return task as Task
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
    const updates: Partial<InsertTask> & { completedAt?: Date | null } = {
      status: newStatus,
    }

    // Handle status transitions
    if (newStatus === 'in_progress' && oldStatus !== 'in_progress') {
      // Starting in-progress: demote current in_progress task to pinned
      const allTasks = await this.getTasks(userId)
      const currentInProgressTask = allTasks.find(
        (t) => t.status === 'in_progress' && t.id !== id,
      )
      if (currentInProgressTask) {
        // Stop timer on old in-progress task and set to pinned
        const elapsed = currentInProgressTask.inProgressStartedAt
          ? Date.now() - currentInProgressTask.inProgressStartedAt.getTime()
          : 0
        await db
          .update(tasks)
          .set({
            status: 'pinned',
            inProgressTime:
              (currentInProgressTask.inProgressTime || 0) + elapsed,
            inProgressStartedAt: null,
          })
          .where(eq(tasks.id, currentInProgressTask.id))
      }
      // Start timer on new in-progress task
      updates.inProgressStartedAt = new Date()
    }

    if (
      oldStatus === 'in_progress' &&
      newStatus !== 'in_progress' &&
      currentTask.inProgressStartedAt
    ) {
      // Leaving in-progress: accumulate time
      const elapsed = Date.now() - currentTask.inProgressStartedAt.getTime()
      updates.inProgressTime = (currentTask.inProgressTime || 0) + elapsed
      updates.inProgressStartedAt = null
    }

    if (newStatus === 'completed') {
      updates.completedAt = new Date()
    }

    if (oldStatus === 'completed' && newStatus !== 'completed') {
      updates.completedAt = null
    }

    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning()

    // Cascade status to children for completed/restored
    if (
      newStatus === 'completed' ||
      (oldStatus === 'completed' && newStatus === 'open')
    ) {
      const childTasks = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.parentId, id), eq(tasks.userId, userId)))
      for (const child of childTasks) {
        await this.setTaskStatus(child.id, userId, newStatus)
      }
    }

    return task as Task
  }

  async updateTask(
    id: number,
    userId: string,
    updates: UpdateTaskArg,
  ): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning()

    return task as Task
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
      const timeToAccumulate = await this.getTotalTimeForTask(id, userId)
      if (timeToAccumulate > 0) {
        const parent = await this.getTask(taskToDelete.parentId, userId)
        if (parent) {
          await db
            .update(tasks)
            .set({
              inProgressTime: (parent.inProgressTime ?? 0) + timeToAccumulate,
            })
            .where(
              and(
                eq(tasks.id, taskToDelete.parentId),
                eq(tasks.userId, userId),
              ),
            )
        }
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

  async getSettings(userId: string): Promise<UserSettings> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
    if (settings) {
      return settings as UserSettings
    }
    // Create default settings for new user
    const [newSettings] = await db
      .insert(userSettings)
      .values({ userId })
      .returning()
    return newSettings as UserSettings
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
    return settings as UserSettings
  }
}

export const storage = new DatabaseStorage()
