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
    const allTasks = await db.select().from(tasks).orderBy(tasks.id);
    if (allTasks.length === 0) {
      const testTasks: InsertTask[] = [
        { name: "Plan vacation", priority: "medium", ease: "medium", enjoyment: "high", time: "medium" },
        { name: "Research flights", priority: "high", ease: "easy", enjoyment: "medium", time: "low" },
        { name: "Book hotel", priority: "medium", ease: "hard", enjoyment: "low", time: "medium" },
        { name: "Clean the house", priority: "low", ease: "medium", enjoyment: "low", time: "high" },
        { name: "Mop floors", priority: "low", ease: "easy", enjoyment: "low", time: "medium" },
        { name: "Learn a new recipe", priority: "medium", ease: "hard", enjoyment: "high", time: "medium" },
        { name: "Buy ingredients", priority: "medium", ease: "easy", enjoyment: "medium", time: "low" },
      ];
      await db.insert(tasks).values(testTasks);
      return await db.select().from(tasks).orderBy(tasks.id);
    }
    return allTasks;
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
    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: number): Promise<void> {
    // Note: If we strictly enforced foreign keys, we'd need to handle subtasks.
    // For now, we assume simple deletion or the DB handles cascade if configured (it's not explicit in schema but standard behavior).
    await db.delete(tasks).where(eq(tasks.id, id));
  }
}

export const storage = new DatabaseStorage();
