import { db } from "./db";
import {
  tasks,
  type Task,
  type InsertTask,
  type UpdateTaskRequest,
  type TaskStatus
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: UpdateTaskRequest): Promise<Task>;
  deleteTask(id: number): Promise<void>;
  setTaskStatus(id: number, newStatus: TaskStatus): Promise<Task>;
}

export class DatabaseStorage implements IStorage {
  async getTasks(): Promise<Task[]> {
    const result = await db.select().from(tasks).orderBy(tasks.id);
    return result as Task[];
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task as Task | undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task as Task;
  }

  async setTaskStatus(id: number, newStatus: TaskStatus): Promise<Task> {
    const currentTask = await this.getTask(id);
    if (!currentTask) {
      throw new Error('Task not found');
    }

    const oldStatus = currentTask.status;
    const updates: Partial<InsertTask> & { completedAt?: Date | null } = { status: newStatus };

    // Handle status transitions
    if (newStatus === 'in_progress' && oldStatus !== 'in_progress') {
      // Starting in-progress: demote current in_progress task to pinned
      const allTasks = await this.getTasks();
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
      const childTasks = await db.select().from(tasks).where(eq(tasks.parentId, id));
      for (const child of childTasks) {
        await this.setTaskStatus(child.id, newStatus);
      }
    }

    return task as Task;
  }

  async updateTask(id: number, updates: UpdateTaskRequest): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();

    return task as Task;
  }

  async deleteTask(id: number): Promise<void> {
    // Delete all subtasks first (recursive)
    const childTasks = await db.select().from(tasks).where(eq(tasks.parentId, id));
    for (const child of childTasks) {
      await this.deleteTask(child.id);
    }
    
    await db.delete(tasks).where(eq(tasks.id, id));
  }
}

export const storage = new DatabaseStorage();
