import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.tasks.list.path, async (req, res) => {
    const tasks = await storage.getTasks();
    res.json(tasks);
  });

  app.get(api.tasks.get.path, async (req, res) => {
    const task = await storage.getTask(Number(req.params.id));
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  });

  app.post(api.tasks.create.path, async (req, res) => {
    try {
      const input = api.tasks.create.input.parse(req.body);
      const task = await storage.createTask(input);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.tasks.update.path, async (req, res) => {
    try {
      const input = api.tasks.update.input.parse(req.body);
      // Ensure id exists
      const existing = await storage.getTask(Number(req.params.id));
      if (!existing) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      const task = await storage.updateTask(Number(req.params.id), input);
      res.json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.tasks.delete.path, async (req, res) => {
    const existing = await storage.getTask(Number(req.params.id));
    if (!existing) {
      return res.status(404).json({ message: 'Task not found' });
    }
    await storage.deleteTask(Number(req.params.id));
    res.status(204).send();
  });

  // Seed data if empty
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getTasks();
  if (existing.length === 0) {
    // Root task 1
    const task1 = await storage.createTask({
      name: "Plan Vacation",
      description: "Organize the summer trip to Italy",
      priority: "high",
      ease: "medium",
      enjoyment: "high",
      time: "high",
      createdAt: new Date(),
    });

    // Subtask 1.1
    await storage.createTask({
      name: "Book Flights",
      description: "Look for direct flights if possible",
      priority: "high",
      ease: "medium",
      enjoyment: "medium",
      time: "medium",
      parentId: task1.id,
      createdAt: new Date(),
    });

     // Subtask 1.2
     await storage.createTask({
      name: "Find Hotels",
      description: "Check reviews on Tripadvisor",
      priority: "medium",
      ease: "hard",
      enjoyment: "medium",
      time: "high",
      parentId: task1.id,
      createdAt: new Date(),
    });

    // Root task 2
    await storage.createTask({
      name: "Clean Garage",
      description: "It's a mess",
      priority: "low",
      ease: "hard",
      enjoyment: "low",
      time: "high",
      createdAt: new Date(),
    });

    // Root task 3
    const task3 = await storage.createTask({
      name: "Learn Rust",
      description: "Read the book",
      priority: "medium",
      ease: "hard",
      enjoyment: "high",
      time: "high",
      createdAt: new Date(),
    });
    
    await storage.createTask({
      name: "Install Rustup",
      description: "",
      priority: "high",
      ease: "easy",
      enjoyment: "medium",
      time: "low",
      parentId: task3.id,
      createdAt: new Date(),
    });
  }
}
