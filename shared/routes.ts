import { z } from 'zod'

import { 
  insertTaskSchema, 
  insertUserSettingsSchema, 
  taskStatusEnum, 
  priorityEnum,
  easeEnum,
  enjoymentEnum,
  timeEnum,
  type tasks, 
  type userSettings 
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
        200: z.array(z.custom<typeof tasks.$inferSelect>()),
      },
    },
    get: {
      method: 'GET',
      path: '/api/tasks/:id',
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST',
      path: '/api/tasks',
      input: insertTaskSchema,
      responses: {
        201: z.custom<typeof tasks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT',
      path: '/api/tasks/:id',
      input: insertTaskSchema.partial(),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
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
        200: z.custom<typeof tasks.$inferSelect>(),
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
          tasks: z.array(z.custom<Omit<typeof tasks.$inferSelect, 'id' | 'userId'>>()),
        }),
      },
    },
    import: {
      method: 'POST',
      path: '/api/tasks/import',
      input: z.object({
        tasks: z.array(z.object({
          id: z.number().optional(),
          name: z.string(),
          description: z.string().nullish(),
          priority: priorityEnum.nullish(),
          ease: easeEnum.nullish(),
          enjoyment: enjoymentEnum.nullish(),
          time: timeEnum.nullish(),
          parentId: z.number().nullish(),
          status: taskStatusEnum.optional(),
          inProgressTime: z.number().optional(),
          createdAt: z.string().optional(),
          completedAt: z.string().nullish(),
        })),
      }),
      responses: {
        200: z.object({
          message: z.string(),
          imported: z.number(),
        }),
        400: errorSchemas.validation,
      },
    },
  },
  settings: {
    get: {
      method: 'GET',
      path: '/api/settings',
      responses: {
        200: z.custom<typeof userSettings.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT',
      path: '/api/settings',
      input: insertUserSettingsSchema.omit({ userId: true }).partial(),
      responses: {
        200: z.custom<typeof userSettings.$inferSelect>(),
      },
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

export type TaskInput = z.infer<typeof api.tasks.create.input>
export type TaskResponse = z.infer<(typeof api.tasks.create.responses)[201]>
