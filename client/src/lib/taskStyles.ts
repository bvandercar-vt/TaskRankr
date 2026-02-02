import type {
  Ease,
  Enjoyment,
  Priority,
  TaskSortField,
  Time,
} from '@shared/schema'

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

const PRIORITY_STYLES: Record<Priority, string> = {
  highest: STYLES_COMMON.red_bold,
  high: STYLES_COMMON.red,
  medium: STYLES_COMMON.yellow,
  low: STYLES_COMMON.green,
  lowest: STYLES_COMMON.green_dull,
  none: STYLES_COMMON.none,
}

const EASE_STYLES: Record<Ease, string> = {
  hardest: STYLES_COMMON.red_dull,
  hard: STYLES_COMMON.red,
  medium: STYLES_COMMON.yellow,
  easy: STYLES_COMMON.green,
  easiest: STYLES_COMMON.green_bold,
  none: STYLES_COMMON.none,
}

const ENJOYMENT_STYLES: Record<Enjoyment, string> = {
  lowest: STYLES_COMMON.red_dull,
  low: STYLES_COMMON.red,
  medium: STYLES_COMMON.yellow,
  high: STYLES_COMMON.green,
  highest: STYLES_COMMON.green_bold,
  none: STYLES_COMMON.none,
}

const TIME_STYLES: Record<Time, string> = {
  highest: STYLES_COMMON.red_dull,
  high: STYLES_COMMON.red,
  medium: STYLES_COMMON.yellow,
  low: STYLES_COMMON.green,
  lowest: STYLES_COMMON.green_bold,
  none: STYLES_COMMON.none,
}

const DEFAULT_STYLE = 'text-slate-400'

export const getPriorityStyle = (level: Priority | null | undefined): string =>
  level ? (PRIORITY_STYLES[level] ?? DEFAULT_STYLE) : DEFAULT_STYLE

export const getEaseStyle = (level: Ease | null | undefined): string =>
  level ? (EASE_STYLES[level] ?? DEFAULT_STYLE) : DEFAULT_STYLE

export const getEnjoymentStyle = (
  level: Enjoyment | null | undefined,
): string =>
  level ? (ENJOYMENT_STYLES[level] ?? DEFAULT_STYLE) : DEFAULT_STYLE

export const getTimeStyle = (level: Time | null | undefined): string =>
  level ? (TIME_STYLES[level] ?? DEFAULT_STYLE) : DEFAULT_STYLE

type TaksSortFieldMap = {
  priority: Priority
  ease: Ease
  enjoyment: Enjoyment
  time: Time
}

export const getAttributeStyle = <Field extends TaskSortField>(
  field: Field,
  value: TaksSortFieldMap[Field] | null | undefined,
  defaultStyle: string = DEFAULT_STYLE,
): string => {
  let style: string
  switch (field) {
    case 'priority':
      style = getPriorityStyle(value as Priority)
      break
    case 'ease':
      style = getEaseStyle(value as Ease)
      break
    case 'enjoyment':
      style = getEnjoymentStyle(value as Enjoyment)
      break
    case 'time':
      style = getTimeStyle(value as Time)
      break
    default:
      return defaultStyle
  }
  return style === DEFAULT_STYLE ? defaultStyle : style
}
