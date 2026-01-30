import { db } from "./db";
import {
  tasks,
  type Task,
  type InsertTask,
  type UpdateTaskRequest,
  type TaskStatus
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getTasks(userId: string): Promise<Task[]>;
  getTask(id: number, userId: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, userId: string, updates: UpdateTaskRequest): Promise<Task>;
  deleteTask(id: number, userId: string): Promise<void>;
  setTaskStatus(id: number, userId: string, newStatus: TaskStatus): Promise<Task>;
}

export class DatabaseStorage implements IStorage {
  async getTasks(userId: string): Promise<Task[]> {
    const result = await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(tasks.id);
    return result as Task[];
  }

  async getTask(id: number, userId: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return task as Task | undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task as Task;
  }

  async setTaskStatus(id: number, userId: string, newStatus: TaskStatus): Promise<Task> {
    const currentTask = await this.getTask(id, userId);
    if (!currentTask) {
      throw new Error('Task not found');
    }

    const oldStatus = currentTask.status;
    const updates: Partial<InsertTask> & { completedAt?: Date | null } = { status: newStatus };

    // Handle status transitions
    if (newStatus === 'in_progress' && oldStatus !== 'in_progress') {
      // Starting in-progress: demote current in_progress task to pinned
      const allTasks = await this.getTasks(userId);
      const currentInProgressTask = allTasks.find(t => t.status === 'in_progress' && t.id !== id);
      if (currentInProgressTask) {
        // Stop timer on old in-progress task and set to pinned
        const elapsed = currentInProgressTask.inProgressStartedAt 
          ? Date.now() - currentInProgressTask.inProgressStartedAt.getTime() 
          : 0;
        await db.update(tasks)
          .set({
            status: 'pinned',
            inProgressTime: (currentInProgressTask.inProgressTime || 0) + elapsed,
            inProgressStartedAt: null
          })
          .where(eq(tasks.id, currentInProgressTask.id));
      }
      // Start timer on new in-progress task
      updates.inProgressStartedAt = new Date();
    }

    if (oldStatus === 'in_progress' && newStatus !== 'in_progress' && currentTask.inProgressStartedAt) {
      // Leaving in-progress: accumulate time
      const elapsed = Date.now() - currentTask.inProgressStartedAt.getTime();
      updates.inProgressTime = (currentTask.inProgressTime || 0) + elapsed;
      updates.inProgressStartedAt = null;
    }

    if (newStatus === 'completed') {
      updates.completedAt = new Date();
    }

    if (oldStatus === 'completed' && newStatus !== 'completed') {
      updates.completedAt = null;
    }

    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();

    // Cascade status to children for completed/restored
    if (newStatus === 'completed' || (oldStatus === 'completed' && newStatus === 'open')) {
      const childTasks = await db.select().from(tasks).where(and(eq(tasks.parentId, id), eq(tasks.userId, userId)));
      for (const child of childTasks) {
        await this.setTaskStatus(child.id, userId, newStatus);
      }
    }

    return task as Task;
  }

  async updateTask(id: number, userId: string, updates: UpdateTaskRequest): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    return task as Task;
  }

  async deleteTask(id: number, userId: string): Promise<void> {
    // Delete all subtasks first (recursive)
    const childTasks = await db.select().from(tasks).where(and(eq(tasks.parentId, id), eq(tasks.userId, userId)));
    for (const child of childTasks) {
      await this.deleteTask(child.id, userId);
    }
    
    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
