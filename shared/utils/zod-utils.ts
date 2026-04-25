import { z } from 'zod'

type DefaultedKeys<S extends z.ZodRawShape> = {
  [K in keyof S]: S[K] extends z.ZodDefault<z.ZodTypeAny> ? K : never
}[keyof S]

export type SchemaDefaults<T extends z.AnyZodObject> = {
  [K in DefaultedKeys<T['shape']>]: z.infer<T['shape'][K]>
}

/**
 * Walks the `schema`'s shape, picks every field whose top-level schema is a
 * `ZodDefault`, and returns the resolved default values for those fields.
 *
 * Implementation detail: zod's `.partial()` wraps each field in `ZodOptional`,
 * which short-circuits on `undefined` and never invokes the inner `.default()`.
 * `.pick(...)` keeps the `ZodDefault` wrapper intact, so parsing `{}` triggers
 * each default. This helper does the picking automatically.
 *
 * Caveat: function-style defaults (e.g. `z.date().default(() => new Date())`)
 * are evaluated once when this helper is called. For values that must be
 * recomputed per use (like timestamps), evaluate at the call site instead.
 */
export const getZodSchemaDefaults = <T extends z.AnyZodObject>(
  schema: T,
): SchemaDefaults<T> => {
  const mask: Record<string, true> = {}
  for (const [key, field] of Object.entries(schema.shape)) {
    if (field instanceof z.ZodDefault) mask[key] = true
  }
  // `.pick`'s `Exactly` constraint can't be satisfied with a dynamically-built
  // mask, so we cast at the boundary; `SchemaDefaults<T>` keeps the call site
  // strongly typed.
  // biome-ignore lint/suspicious/noExplicitAny: see comment above
  return schema.pick(mask as any).parse({}) as SchemaDefaults<T>
}
