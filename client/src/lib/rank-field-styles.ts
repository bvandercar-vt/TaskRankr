/**
 * @fileoverview Defines tailwind color and style mappings for task rank fields
 * (priority, ease, enjoyment, time).
 */

import type { RankField } from '~/shared/schema'
import type { RankFieldValueMap } from './task-utils'

const STYLES_COMMON = {
  red: 'text-red-400 bg-red-400/10 border-red-500/20',
  yellow: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  green: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  red_bold: 'text-red-700 bg-red-400/10 border-red-500/20',
  green_bold: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
  green_dull: 'text-emerald-600/60 bg-emerald-600/5 border-emerald-600/10',
  red_dull: 'text-red-400/60 bg-red-400/10 border-red-500/60',
  none: '',
}

const RANK_FIELD_STYLES = {
  priority: {
    highest: STYLES_COMMON.red_bold,
    high: STYLES_COMMON.red,
    medium: STYLES_COMMON.yellow,
    low: STYLES_COMMON.green,
    lowest: STYLES_COMMON.green_dull,
  },
  ease: {
    hardest: STYLES_COMMON.red_dull,
    hard: STYLES_COMMON.red,
    medium: STYLES_COMMON.yellow,
    easy: STYLES_COMMON.green,
    easiest: STYLES_COMMON.green_bold,
  },
  enjoyment: {
    lowest: STYLES_COMMON.red_dull,
    low: STYLES_COMMON.red,
    medium: STYLES_COMMON.yellow,
    high: STYLES_COMMON.green,
    highest: STYLES_COMMON.green_bold,
  },
  time: {
    highest: STYLES_COMMON.red_dull,
    high: STYLES_COMMON.red,
    medium: STYLES_COMMON.yellow,
    low: STYLES_COMMON.green,
    lowest: STYLES_COMMON.green_bold,
  },
} as const satisfies {
  [F in RankField]: Record<RankFieldValueMap[F], string>
}

export const getRankFieldStyle = <
  Field extends RankField,
  Value extends RankFieldValueMap[Field],
>(
  field: Field,
  value: Value | null | undefined,
  defaultStyle = 'text-slate-400 text-muted-foreground italic',
): string => {
  const styles = RANK_FIELD_STYLES[field] as Record<Value, string>
  if (!styles || !value) return defaultStyle
  return styles[value] ?? defaultStyle
}
