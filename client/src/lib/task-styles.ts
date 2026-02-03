import type { SortFieldValueMap, TaskSortField } from '~/shared/schema'

const STYLES_COMMON = {
  red: 'text-red-400 bg-red-400/10 border-red-500/20',
  yellow: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  green: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  red_bold: 'text-red-700 bg-red-400/10 border-red-500/20',
  green_bold: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
  green_dull: 'text-emerald-600/60 bg-emerald-600/5 border-emerald-600/10',
  red_dull: 'text-red-400/60 bg-red-400/10 border-red-500/60',
  none: 'text-muted-foreground italic',
}

const DEFAULT_STYLE = 'text-slate-400'

const TASK_SORT_FIELD_STYLES = {
  priority: {
    highest: STYLES_COMMON.red_bold,
    high: STYLES_COMMON.red,
    medium: STYLES_COMMON.yellow,
    low: STYLES_COMMON.green,
    lowest: STYLES_COMMON.green_dull,
    none: STYLES_COMMON.none,
  },
  ease: {
    hardest: STYLES_COMMON.red_dull,
    hard: STYLES_COMMON.red,
    medium: STYLES_COMMON.yellow,
    easy: STYLES_COMMON.green,
    easiest: STYLES_COMMON.green_bold,
    none: STYLES_COMMON.none,
  },
  enjoyment: {
    lowest: STYLES_COMMON.red_dull,
    low: STYLES_COMMON.red,
    medium: STYLES_COMMON.yellow,
    high: STYLES_COMMON.green,
    highest: STYLES_COMMON.green_bold,
    none: STYLES_COMMON.none,
  },
  time: {
    highest: STYLES_COMMON.red_dull,
    high: STYLES_COMMON.red,
    medium: STYLES_COMMON.yellow,
    low: STYLES_COMMON.green,
    lowest: STYLES_COMMON.green_bold,
    none: STYLES_COMMON.none,
  },
} as const satisfies {
  [Field in TaskSortField]: Record<SortFieldValueMap[Field], string>
}

export const getAttributeStyle = <
  Field extends TaskSortField,
  Value extends SortFieldValueMap[Field],
>(
  field: Field,
  value: Value | null | undefined,
  defaultStyle: string = DEFAULT_STYLE,
): string => {
  const styles = TASK_SORT_FIELD_STYLES[field] as Record<Value, string>
  if (!styles || !value) return defaultStyle
  const style = styles[value] ?? defaultStyle
  return style === DEFAULT_STYLE ? defaultStyle : style
}
