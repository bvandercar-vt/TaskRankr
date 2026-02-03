import type { Simplify } from 'type-fest'

export type PickByKey<T, Matcher> = Simplify<{
  [K in keyof T as K extends Matcher ? K : never]: T[K]
}>
