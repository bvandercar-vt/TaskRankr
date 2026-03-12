/**
 * @fileoverview API route handlers using ts-rest contract-based routing.
 *
 * Defines all task and settings CRUD endpoints with authentication middleware.
 * Handles task status transitions, import/export functionality, and user settings.
 * Integrates with Replit Auth for user session management.
 */

import type { Server } from 'node:http'
import { createExpressEndpoints, initServer } from '@ts-rest/express'
import { isNil, omit } from 'es-toolkit'
import type { Express } from 'express'

import { AuthPaths } from '~/shared/constants'
import { contract } from '~/shared/contract'
import { TaskStatus } from '~/shared/schema'
import {
  authStorage,
  isAuthenticated,
  registerAuthRoutes,
  setupAuth,
} from './replit_integrations/auth'
import type { UserSession } from './replit_integrations/auth/replitAuth'
import { storage } from './storage'

const s = initServer()

// biome-ignore lint/suspicious/noExplicitAny: is always present
const getUserId = (req: Record<string, any>): string =>
  // biome-ignore lint/style/noNonNullAssertion: is always present
  (req.user as UserSession).claims!.sub

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
        return {
          status: 200,
          body: {
            version: 1,
            exportedAt: new Date().toISOString(),
            tasks: tasks.map((t) => omit(t, ['userId'])),
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
            description: rest.description ?? null,
            priority: rest.priority ?? null,
            ease: rest.ease ?? null,
            enjoyment: rest.enjoyment ?? null,
            time: rest.time ?? null,
            userId,
            parentId: null,
            status: rest.status ?? TaskStatus.OPEN,
            inProgressTime: rest.inProgressTime ?? 0,
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
    reorderSubtasks: {
      middleware: [isAuthenticated],
      handler: async ({ params, body, req }) => {
        const userId = getUserId(req)
        const parentTask = await storage.getTask(params.id, userId)
        if (!parentTask) {
          return { status: 404, body: { message: 'Parent task not found' } }
        }

        await storage.reorderSubtasks(params.id, userId, body.orderedIds)
        return { status: 200, body: { message: 'Subtasks reordered' } }
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

  if (process.env.NODE_ENV !== 'production') {
    registerTestRoutes(app)
  }

  createExpressEndpoints(contract, router, app)

  return httpServer
}

/** Hardcoded user identity used by every Cypress test run. */
const TEST_USER_ID = 'cypress-test-user'

/**
 * Registers test-only routes that are never reachable in production.
 *
 * WHY THESE EXIST
 * ---------------
 * The production login flow requires a live Replit OIDC provider — a browser
 * redirect to replit.com, a token exchange, and a signed JWT. None of that is
 * feasible in a headless CI environment (no real credentials, no redirect
 * handling). These three endpoints give Cypress a controlled alternative:
 *
 *  POST /api/test/login  – Creates (or upserts) the test user in the DB and
 *    calls Passport's req.login(), which writes a real encrypted session cookie
 *    using the same middleware the production flow uses. Downstream route
 *    handlers never know the difference — they see a valid session.
 *
 *  GET  /api/test/tasks  – Returns the test user's tasks without requiring a
 *    session. Used by guest-mode tests to verify that locally-created tasks are
 *    NOT leaked to the server, a check that cannot be made via the normal
 *    authenticated API from an unauthenticated test context.
 *
 *  DELETE /api/test/tasks – Wipes all tasks for the test user so each test run
 *    starts from a clean slate regardless of prior state.
 *
 * SECURITY
 * --------
 * All three routes are only registered when NODE_ENV !== 'production', so they
 * are unreachable in any deployed environment.
 */
function registerTestRoutes(app: Express): void {
  app.post(AuthPaths.TEST_LOGIN, async (req, res) => {
    try {
      await authStorage.upsertUser({
        id: TEST_USER_ID,
        email: 'cypress@test.local',
        firstName: 'Cypress',
        lastName: 'Test',
        profileImageUrl: null,
      })

      const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
      const user: UserSession = {
        claims: {
          sub: TEST_USER_ID,
          iss: 'test',
          aud: 'test',
          exp: expiresAt,
          iat: Math.floor(Date.now() / 1000),
        } as UserSession['claims'],
        expires_at: expiresAt,
        access_token: 'test-token',
      }

      req.login(user, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: 'Login failed', error: String(err) })
        }
        res.json({ ok: true, userId: TEST_USER_ID })
      })
    } catch (err) {
      res.status(500).json({ message: 'Setup failed', error: String(err) })
    }
  })

  app.get(AuthPaths.TEST_TASKS, async (_req, res) => {
    try {
      const tasks = await storage.getTasks(TEST_USER_ID)
      res.json(tasks)
    } catch (err) {
      res.status(500).json({ message: 'Fetch failed', error: String(err) })
    }
  })

  app.delete(AuthPaths.TEST_TASKS, async (_req, res) => {
    try {
      const tasks = await storage.getTasks(TEST_USER_ID)
      for (const task of tasks) {
        await storage.deleteTask(task.id, TEST_USER_ID)
      }
      res.json({ ok: true, deleted: tasks.length })
    } catch (err) {
      res.status(500).json({ message: 'Cleanup failed', error: String(err) })
    }
  })
}
