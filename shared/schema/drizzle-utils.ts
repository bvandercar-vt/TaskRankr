import type { Column, Table } from 'drizzle-orm'
import { pgEnum as pgEnumBase, type TableConfig } from 'drizzle-orm/pg-core'
import type { BuildSchema } from 'drizzle-zod'
import type { z } from 'zod'

export const pgNativeEnum = <T extends string>(
  name: string,
  strEnum: Record<string, T>,
) => pgEnumBase(name, Object.values(strEnum) as [T, ...T[]])(name)

type ColumnHasDefault<TCol extends Column> =
  TCol['_']['hasDefault'] extends true
    ? TCol['_']['isPrimaryKey'] extends true
      ? false
      : true
    : false

type MaybeCallback<Z extends z.ZodTypeAny, R extends z.ZodTypeAny> =
  | R
  | ((s: Z) => R)

type DrizzleZodDefaultRefineInner<
  T extends Record<string, z.ZodTypeAny>,
  Defaults extends Record<keyof T, boolean>,
> = {
  [K in keyof T as Defaults[K] extends true ? K : never]: MaybeCallback<
    T[K],
    z.ZodDefault<T[K]>
  >
} & {
  [K in keyof T as Defaults[K] extends false ? K : never]?: MaybeCallback<
    T[K],
    T[K]
  >
}

type DrizzleZodDefaultRefineCols<TCols extends TableConfig['columns']> =
  DrizzleZodDefaultRefineInner<
    BuildSchema<'select', TCols, undefined>['shape'],
    { [K in keyof TCols]: ColumnHasDefault<TCols[K]> }
  >

// https://github.com/drizzle-team/drizzle-orm/issues/5384
export type DrizzleZodDefaultRefine<T extends Table> =
  DrizzleZodDefaultRefineCols<T['_']['columns']>
