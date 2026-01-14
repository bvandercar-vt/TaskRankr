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
      const data = {
        "tasks": [
          {
            "title": "Paint for stool chairs",
            "description": "Order paint and refinish the chairs",
            "priority": "low",
            "ease": "easy",
            "time": "low",
            "enjoyment": "high"
          },
          {
            "title": "Alexa mixer",
            "description": "Build and design alexa controllable audio mixer",
            "priority": "low",
            "ease": "hard",
            "time": "high",
            "enjoyment": "high"
          },
          {
            "title": "Better WiFi / Router",
            "priority": "medium",
            "ease": "medium",
            "time": "medium",
            "enjoyment": "medium"
          },
          {
            "title": "Joyous",
            "priority": "low",
            "ease": "easy",
            "time": "low",
            "enjoyment": "high"
          },
          {
            "title": "Update iOS",
            "priority": "low",
            "ease": "medium",
            "time": "medium",
            "enjoyment": "medium"
          },
          {
            "title": "Publish packages",
            "description": "Get packages published to npm/PyPI, put on github page",
            "priority": "high",
            "ease": "medium",
            "time": "medium",
            "enjoyment": "high",
            "children": [
              {
                "title": "type-fest PickBy submission",
                "priority": "low",
                "ease": "medium",
                "time": "medium",
                "enjoyment": "medium"
              },
              {
                "title": "Python Spotify tools",
                "priority": "medium",
                "ease": "hard",
                "time": "high",
                "enjoyment": "high"
              },
              {
                "title": "NPM test helper thing",
                "priority": "high",
                "ease": "medium",
                "time": "medium",
                "enjoyment": "high"
              }
            ]
          },
          {
            "title": "Better task app that has ease and priority",
            "priority": "high",
            "ease": "hard",
            "time": "medium",
            "enjoyment": "high"
          },
          {
            "title": "Resume",
            "priority": "high",
            "ease": "medium",
            "time": "medium",
            "enjoyment": "low"
          },
          {
            "title": "Insurance - Waiting",
            "priority": "high",
            "ease": "medium",
            "time": "low",
            "enjoyment": "low"
          },
          {
            "title": "Order things on Amazon",
            "priority": "medium",
            "ease": "medium",
            "time": "medium",
            "enjoyment": "medium"
          },
          {
            "title": "DFT Mix",
            "priority": "medium",
            "ease": "medium",
            "time": "high",
            "enjoyment": "high"
          },
          {
            "title": "Alex wedding mix thing",
            "priority": "medium",
            "ease": "medium",
            "time": "high",
            "enjoyment": "high"
          },
          {
            "title": "Spotify Playlists",
            "description": "Clean up DJ playlists",
            "priority": "low",
            "ease": "medium",
            "time": "high",
            "enjoyment": "high",
            "children": [
              { "title": "Search thru CTF to add to deep vibey OG wavey" },
              { "title": "Consolidate Monxxy and Monkeystep to Wonky Riddim and DirtySnatcha/DirtMonkey-Ey" },
              { "title": "Chill Hip-Hop" },
              { "title": "Cull CTF" },
              { "title": "Cull Hype Space Hop" },
              { "title": "Psy-Hop Deep Dark OG culll... probably shouldn't be in OG" },
              { "title": "Cull deeper space bass" },
              { "title": "Cull noisy space bass" },
              { "title": "3 DNB playlists", "ease": "medium" },
              { "title": "Wavey and CTF into Deep dark and deep vibey" },
              { "title": "Split up chill electronic" },
              { "title": "Split up groovy funky breaks between aggressive and chill" },
              { "title": "Chill hip hop" },
              { "title": "Groovy Monkeystep and Monxxy make better, deeper boogie T, wonky monxy, dirtysnatcha. Don't need to check deep dubstep, already pulled." }
            ]
          },
          {
            "title": "DFT pics",
            "priority": "high",
            "ease": "medium",
            "time": "medium",
            "enjoyment": "medium"
          },
          {
            "title": "License plate light",
            "priority": "medium",
            "ease": "easy",
            "time": "low",
            "enjoyment": "low"
          },
          {
            "title": "Fix dashcam",
            "priority": "medium",
            "ease": "medium",
            "time": "low",
            "enjoyment": "low"
          },
          {
            "title": "Pics",
            "priority": "medium",
            "ease": "medium",
            "time": "high",
            "enjoyment": "medium"
          },
          {
            "title": "Sell white fairy lights",
            "priority": "low",
            "ease": "easy",
            "time": "low",
            "enjoyment": "low"
          },
          {
            "title": "Annie jewelry shine",
            "priority": "low",
            "ease": "easy",
            "time": "low",
            "enjoyment": "high"
          },
          {
            "title": "Look up cheaper Car Insurance",
            "priority": "low",
            "ease": "medium",
            "time": "medium",
            "enjoyment": "low"
          },
          {
            "title": "Car registration",
            "description": "P0420 #0711 Catalytic Ststem efficiency below threshold Bank 1\n\nP0430 \"\"\"\" Bank 2\n\nB1S1 10.4 MAX 40\nB1S2 0.048 MAX 0.435\n\nB2S1 10.6 MAX 40\nB2S2 0.041 MAX 0.429",
            "priority": "high",
            "ease": "hard",
            "time": "high",
            "enjoyment": "low"
          },
          {
            "title": "Ski pole solution",
            "priority": "low",
            "ease": "medium",
            "time": "low",
            "enjoyment": "high"
          },
          {
            "title": "Change iPhone background",
            "priority": "low",
            "ease": "easy",
            "time": "low",
            "enjoyment": "low"
          },
          {
            "title": "New Longboard",
            "priority": "low",
            "ease": "easy",
            "time": "low",
            "enjoyment": "medium"
          },
          {
            "title": "Bikes",
            "priority": "low",
            "ease": "hard",
            "time": "high",
            "enjoyment": "medium",
            "children": [
              {
                "title": "Fix red one (go to bikestogether)",
                "priority": "medium",
                "ease": "medium",
                "time": "medium",
                "enjoyment": "medium"
              },
              {
                "title": "Fix brakes on old one",
                "priority": "medium",
                "ease": "medium",
                "time": "low",
                "enjoyment": "medium"
              },
              { "title": "Sell old one" },
              { "title": "Sell others, whichever they are" }
            ]
          },
          {
            "title": "Sell Skis",
            "priority": "medium",
            "ease": "medium",
            "time": "medium",
            "enjoyment": "medium"
          },
          {
            "title": "DJ Stuff",
            "priority": "low",
            "ease": "medium",
            "time": "high",
            "enjoyment": "high",
            "children": [
              { "title": "Live Streams? " },
              { "title": "TikToks?" },
              { "title": "Next mix" }
            ]
          },
          {
            "title": "New job",
            "priority": "high",
            "ease": "hard",
            "time": "high",
            "enjoyment": "low"
          },
          {
            "title": "Go Through Pics",
            "description": "Organize photos",
            "priority": "medium",
            "ease": "medium",
            "time": "high",
            "enjoyment": "medium",
            "children": [
              { "title": "Duplicates app" }
            ]
          },
          {
            "title": "Car Audio",
            "priority": "low",
            "ease": "medium",
            "time": "high",
            "enjoyment": "medium",
            "children": [
              { "title": "Removable port?" },
              { "title": "Different subs" },
              { "title": "Try noise remove" },
              { "title": "3D Printed tweeter mounts" },
              { "title": "Always try DSP re-tuning!" }
            ]
          },
          {
            "title": "Buy jeans",
            "priority": "low",
            "ease": "easy",
            "time": "low",
            "enjoyment": "medium"
          },
          {
            "title": "Demo skis",
            "priority": "medium",
            "ease": "medium",
            "time": "high",
            "enjoyment": "medium"
          }
        ]
      };

      const mapValue = (type: string, val?: string) => {
        if (!val) return "medium";
        const v = val.toLowerCase();
        if (type === 'ease') {
          if (v === 'high' || v === 'easy') return 'easy';
          if (v === 'low' || v === 'hard') return 'hard';
          return 'medium';
        }
        if (type === 'time') {
          if (v === 'short' || v === 'low') return 'low';
          if (v === 'long' || v === 'high') return 'high';
          return 'medium';
        }
        return v === 'high' || v === 'medium' || v === 'low' ? v : 'medium';
      };

      for (const t of data.tasks) {
        const [task] = await db.insert(tasks).values({
          name: t.title,
          description: (t as any).description || null,
          priority: mapValue('priority', (t as any).priority) as any,
          ease: mapValue('ease', (t as any).ease) as any,
          enjoyment: mapValue('enjoyment', (t as any).enjoyment) as any,
          time: mapValue('time', (t as any).time) as any,
        }).returning();

        if ((t as any).children) {
          for (const c of (t as any).children) {
            await db.insert(tasks).values({
              name: c.title,
              description: c.description || null,
              priority: mapValue('priority', c.priority) as any,
              ease: mapValue('ease', c.ease) as any,
              enjoyment: mapValue('enjoyment', c.enjoyment) as any,
              time: mapValue('time', c.time) as any,
              parentId: task.id
            });
          }
        }
      }
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
