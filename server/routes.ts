import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup auth before other routes
  await setupAuth(app);
  registerAuthRoutes(app);

  // Helper to get userId from request
  const getUserId = (req: any): string => req.user?.claims?.sub;
  
  app.get(api.tasks.list.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const tasks = await storage.getTasks(userId);
    res.json(tasks);
  });

  app.get(api.tasks.get.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const task = await storage.getTask(Number(req.params.id), userId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  });

  app.post(api.tasks.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const input = api.tasks.create.input.parse({ ...req.body, userId });
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

  app.put(api.tasks.update.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const input = api.tasks.update.input.parse(req.body);
      const existing = await storage.getTask(Number(req.params.id), userId);
      if (!existing) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      const task = await storage.updateTask(Number(req.params.id), userId, input);
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

  app.put(api.tasks.setStatus.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const input = api.tasks.setStatus.input.parse(req.body);
      const existing = await storage.getTask(Number(req.params.id), userId);
      if (!existing) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      const task = await storage.setTaskStatus(Number(req.params.id), userId, input.status);
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

  app.delete(api.tasks.delete.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const existing = await storage.getTask(Number(req.params.id), userId);
    if (!existing) {
      return res.status(404).json({ message: 'Task not found' });
    }
    await storage.deleteTask(Number(req.params.id), userId);
    res.status(204).send();
  });

  return httpServer;
}
