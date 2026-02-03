import type { Server } from 'node:http'
import { createExpressEndpoints, initServer } from '@ts-rest/express'
import { isNil } from 'es-toolkit'
import type { Express } from 'express'

import { contract } from '~/shared/contract'
import {
  isAuthenticated,
  registerAuthRoutes,
  setupAuth,
} from './replit_integrations/auth'
import { storage } from './storage'

const s = initServer()

// biome-ignore lint/suspicious/noExplicitAny: from Replit auth
const getUserId = (req: Record<string, any>): string => req.user.claims?.sub

const router = s.router(contract, {
  tasks: {
    list: {
      middleware: [isAuthenticated],
      handler: async ({ req }) => {
        const userId = getUserId(req)
        const tasks = await storage.getTasks(userId)
        return { status: 200, body: tasks }
      },
    },
    get: {
      middleware: [isAuthenticated],
      handler: async ({ params, req }) => {
        const userId = getUserId(req)
        const task = await storage.getTask(params.id, userId)
        if (!task) {
          return { status: 404, body: { message: 'Task not found' } }
        }
        return { status: 200, body: task }
      },
    },
    create: {
      middleware: [isAuthenticated],
      handler: async ({ body, req }) => {
        const userId = getUserId(req)
        const task = await storage.createTask({ ...body, userId })
        return { status: 201, body: task }
      },
    },
    update: {
      middleware: [isAuthenticated],
      handler: async ({ params, body, req }) => {
        const userId = getUserId(req)
        const existing = await storage.getTask(params.id, userId)
        if (!existing) {
          return { status: 404, body: { message: 'Task not found' } }
        }
        const task = await storage.updateTask(params.id, userId, body)
        return { status: 200, body: task }
      },
    },
    delete: {
      middleware: [isAuthenticated],
      handler: async ({ params, req }) => {
        const userId = getUserId(req)
        const existing = await storage.getTask(params.id, userId)
        if (!existing) {
          return { status: 404, body: { message: 'Task not found' } }
        }
        await storage.deleteTask(params.id, userId)
        return { status: 204, body: undefined }
      },
    },
    setStatus: {
      middleware: [isAuthenticated],
      handler: async ({ params, body, req }) => {
        const userId = getUserId(req)
        const existing = await storage.getTask(params.id, userId)
        if (!existing) {
          return { status: 404, body: { message: 'Task not found' } }
        }
        const task = await storage.setTaskStatus(params.id, userId, body.status)
        return { status: 200, body: task }
      },
    },
    export: {
      middleware: [isAuthenticated],
      handler: async ({ req }) => {
        const userId = getUserId(req)
        const tasks = await storage.getTasks(userId)
        const exportData = tasks.map(({ id, userId: _, ...task }) => task)
        return {
          status: 200,
          body: {
            version: 1,
            exportedAt: new Date().toISOString(),
            tasks: exportData,
          },
        }
      },
    },
    import: {
      middleware: [isAuthenticated],
      handler: async ({ body, req }) => {
        const userId = getUserId(req)
        const { tasks } = body
        const idMap = new Map<number, number>()

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
            parentId: null,
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

        for (const taskData of tasks) {
          if (isNil(taskData.parentId) || isNil(taskData.id)) continue
          const newId = idMap.get(taskData.id)
          const newParentId = idMap.get(taskData.parentId)
          if (newId !== undefined && newParentId !== undefined) {
            await storage.updateTask(newId, userId, { parentId: newParentId })
          }
        }

        return {
          status: 200,
          body: {
            message: `Successfully imported ${idMap.size} tasks`,
            imported: idMap.size,
          },
        }
      },
    },
  },
  settings: {
    get: {
      middleware: [isAuthenticated],
      handler: async ({ req }) => {
        const userId = getUserId(req)
        const settings = await storage.getSettings(userId)
        return { status: 200, body: settings }
      },
    },
    update: {
      middleware: [isAuthenticated],
      handler: async ({ body, req }) => {
        const userId = getUserId(req)
        const settings = await storage.updateSettings(userId, body)
        return { status: 200, body: settings }
      },
    },
  },
})

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  await setupAuth(app)
  registerAuthRoutes(app)

  createExpressEndpoints(contract, router, app)

  return httpServer
}
