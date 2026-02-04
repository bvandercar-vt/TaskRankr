/**
 * @fileoverview Frontend-specific TypeScript utility types
 *
 * Provides generic type utilities for the client application, including
 * PickByKey for extracting object properties matching a key pattern.
 */

import type { Simplify } from 'type-fest'

export type PickByKey<T, Matcher> = Simplify<{
  [K in keyof T as K extends Matcher ? K : never]: T[K]
}>
