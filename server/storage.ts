import { db } from "./db";
import {
  tasks,
  type Task,
  type InsertTask,
  type UpdateTaskRequest
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: UpdateTaskRequest): Promise<Task>;
  deleteTask(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(tasks.id);
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: number, updates: UpdateTaskRequest): Promise<Task> {
    // First get the current task to check for in-progress state changes
    const currentTask = await this.getTask(id);
    if (!currentTask) {
      throw new Error('Task not found');
    }

    // Handle in-progress time accumulation
    let finalUpdates = { ...updates };
    
    if (updates.isInProgress !== undefined && updates.isInProgress !== currentTask.isInProgress) {
      if (updates.isInProgress === true) {
        // Starting in-progress: set the start time
        finalUpdates.inProgressStartedAt = new Date();
      } else if (updates.isInProgress === false && currentTask.inProgressStartedAt) {
        // Stopping in-progress: calculate elapsed time and add to cumulative total
        const elapsed = Date.now() - currentTask.inProgressStartedAt.getTime();
        finalUpdates.inProgressTime = (currentTask.inProgressTime || 0) + elapsed;
        finalUpdates.inProgressStartedAt = null;
      }
    }

    // If completing a task that is in progress, stop the timer first
    if (updates.isCompleted === true && currentTask.isInProgress && currentTask.inProgressStartedAt) {
      const elapsed = Date.now() - currentTask.inProgressStartedAt.getTime();
      finalUpdates.inProgressTime = (currentTask.inProgressTime || 0) + elapsed;
      finalUpdates.isInProgress = false;
      finalUpdates.inProgressStartedAt = null;
    }

    const [task] = await db
      .update(tasks)
      .set(finalUpdates)
      .where(eq(tasks.id, id))
      .returning();

    // If we're marking a task as completed/restoring it, do the same for all children
    if (updates.isCompleted !== undefined) {
      const childTasks = await db.select().from(tasks).where(eq(tasks.parentId, id));
      for (const child of childTasks) {
        await this.updateTask(child.id, updates);
      }
    }

    return task;
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
