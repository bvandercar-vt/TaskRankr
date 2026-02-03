import { z } from 'zod'

import {
  insertTaskSchema,
  insertUserSettingsSchema,
  taskSchema,
  taskStatusEnum,
  userSettingsSchema,
} from './schema'

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
}

export const api = {
  tasks: {
    list: {
      method: 'GET',
      path: '/api/tasks',
      responses: {
        200: z.array(taskSchema),
      },
    },
    get: {
      method: 'GET',
      path: '/api/tasks/:id',
      responses: {
        200: taskSchema,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST',
      path: '/api/tasks',
      input: insertTaskSchema,
      responses: {
        201: taskSchema,
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT',
      path: '/api/tasks/:id',
      input: insertTaskSchema.partial(),
      responses: {
        200: taskSchema,
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE',
      path: '/api/tasks/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    setStatus: {
      method: 'PUT',
      path: '/api/tasks/:id/status',
      input: z.object({ status: taskStatusEnum }),
      responses: {
        200: taskSchema,
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    export: {
      method: 'GET',
      path: '/api/tasks/export',
      responses: {
        200: z.object({
          version: z.number(),
          exportedAt: z.string(),
          tasks: z.array(taskSchema.omit({ userId: true })),
        }),
      },
    },
    import: {
      method: 'POST',
      path: '/api/tasks/import',
      input: z.object({
        tasks: z.array(
          insertTaskSchema.extend({
            id: z.number().nullish(),
            status: insertTaskSchema.shape.status.nullish(),
            parentId: z.number().nullish(),
            inProgressTime: z.number().nullish(),
            createdAt: z.string().nullish(),
            completedAt: z.string().nullish(),
          }),
        ),
      }),
      responses: {
        200: z.object({ message: z.string(), imported: z.number() }),
        400: errorSchemas.validation,
      },
    },
  },
  settings: {
    get: {
      method: 'GET',
      path: '/api/settings',
      responses: {
        200: userSettingsSchema,
      },
    },
    update: {
      method: 'PUT',
      path: '/api/settings',
      input: insertUserSettingsSchema.omit({ userId: true }).partial(),
      responses: {
        200: userSettingsSchema,
      },
    },
  },
  auth: {
    login: {
      method: 'GET',
      path: '/api/login',
    },
    logout: {
      method: 'GET',
      path: '/api/logout',
    },
    callback: {
      method: 'GET',
      path: '/api/callback',
    },
    user: {
      method: 'GET',
      path: '/api/auth/user',
    },
  },
} as const

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value))
      }
    })
  }
  return url
}
