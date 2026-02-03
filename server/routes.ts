import type { Server } from 'node:http'
import type { Express, Request } from 'express'
import { z } from 'zod'

import { api } from '~/shared/routes'
import {
  isAuthenticated,
  registerAuthRoutes,
  setupAuth,
} from './replit_integrations/auth'
import { storage } from './storage'

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Setup auth before other routes
  await setupAuth(app)
  registerAuthRoutes(app)

  // Helper to get userId from request
  const getUserId = (req: Request): string =>
    // biome-ignore lint/suspicious/noExplicitAny: from Replit auth
    (req.user as Record<string, any>).claims?.sub

  app.get(api.tasks.list.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req)
    const tasks = await storage.getTasks(userId)
    res.json(tasks)
  })

  // Export all tasks as JSON (must be before /api/tasks/:id)
  app.get('/api/tasks/export', isAuthenticated, async (req, res) => {
    const userId = getUserId(req)
    const tasks = await storage.getTasks(userId)

    // Remove userId and id from exported tasks for privacy/portability
    const exportData = tasks.map(({ id, userId: _, ...task }) => task)

    res.setHeader('Content-Type', 'application/json')
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="tasks-export.json"',
    )
    res.json({
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks: exportData,
    })
  })

  // Import tasks from JSON
  app.post('/api/tasks/import', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req)
      const { tasks } = req.body

      if (!Array.isArray(tasks)) {
        return res
          .status(400)
          .json({ message: 'Invalid import format: tasks must be an array' })
      }

      // Map old IDs to new IDs for preserving hierarchy
      const idMap = new Map<number, number>()

      // First pass: create all tasks without parentId
      for (const taskData of tasks) {
        const oldId = taskData.id
        const { id, ...rest } = taskData

        const newTask = await storage.createTask({
          name: rest.name,
          description: rest.description || null,
          priority: rest.priority || null,
          ease: rest.ease || null,
          enjoyment: rest.enjoyment || null,
          time: rest.time || null,
          userId,
          parentId: null, // Set in second pass
          status: rest.status || 'open',
          inProgressTime: rest.inProgressTime || 0,
          inProgressStartedAt: null,
          createdAt: rest.createdAt ? new Date(rest.createdAt) : new Date(),
          completedAt: rest.completedAt ? new Date(rest.completedAt) : null,
        })

        if (oldId && newTask) {
          idMap.set(oldId, newTask.id)
        }
      }

      // Second pass: update parentIds using the ID map
      for (const taskData of tasks) {
        if (!taskData.parentId) continue
        const newId = idMap.get(taskData.id)
        const newParentId = idMap.get(taskData.parentId)
        if (newId !== undefined && newParentId !== undefined) {
          await storage.updateTask(newId, userId, { parentId: newParentId })
        }
      }

      res.json({
        message: `Successfully imported ${idMap.size} tasks`,
        imported: idMap.size,
      })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid task data in import' })
      }
      throw err
    }
  })

  app.get(api.tasks.get.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req)
    const task = await storage.getTask(Number(req.params.id), userId)
    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }
    res.json(task)
  })

  app.post(api.tasks.create.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req)
      const input = api.tasks.create.input.parse({ ...req.body, userId })
      const task = await storage.createTask(input)
      res.status(201).json(task)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        })
      }
      throw err
    }
  })

  app.put(api.tasks.update.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req)
      const input = api.tasks.update.input.parse(req.body)
      const existing = await storage.getTask(Number(req.params.id), userId)
      if (!existing) {
        return res.status(404).json({ message: 'Task not found' })
      }

      const task = await storage.updateTask(
        Number(req.params.id),
        userId,
        input,
      )
      res.json(task)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        })
      }
      throw err
    }
  })

  app.put(api.tasks.setStatus.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req)
      const input = api.tasks.setStatus.input.parse(req.body)
      const existing = await storage.getTask(Number(req.params.id), userId)
      if (!existing) {
        return res.status(404).json({ message: 'Task not found' })
      }

      const task = await storage.setTaskStatus(
        Number(req.params.id),
        userId,
        input.status,
      )
      res.json(task)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        })
      }
      throw err
    }
  })

  app.delete(api.tasks.delete.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req)
    const existing = await storage.getTask(Number(req.params.id), userId)
    if (!existing) {
      return res.status(404).json({ message: 'Task not found' })
    }
    await storage.deleteTask(Number(req.params.id), userId)
    res.status(204).send()
  })

  // Settings routes
  app.get('/api/settings', isAuthenticated, async (req, res) => {
    const userId = getUserId(req)
    const settings = await storage.getSettings(userId)
    res.json(settings)
  })

  app.put('/api/settings', isAuthenticated, async (req, res) => {
    const userId = getUserId(req)
    const settings = await storage.updateSettings(userId, req.body)
    res.json(settings)
  })

  return httpServer
}
