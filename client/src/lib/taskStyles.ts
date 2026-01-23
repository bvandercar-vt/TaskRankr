import type {
  Priority,
  Ease,
  Enjoyment,
  Time,
  TaskSortField,
} from "@shared/schema";

type OrNone<T extends string> = T | "none";
type PriorityOrNone = OrNone<Priority>;
type EaseOrNone = OrNone<Ease>;
type EnjoymentOrNone = OrNone<Enjoyment>;
type TimeOrNone = OrNone<Time>;

const PRIORITY_STYLES: Record<PriorityOrNone, string> = {
  highest: "text-red-700 bg-red-400/10 border-red-500/20",
  high: "text-red-400 bg-red-400/10 border-red-500/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  lowest: "text-emerald-600/60 bg-emerald-600/5 border-emerald-600/10",
  none: "text-muted-foreground italic",
};

const EASE_STYLES: Record<EaseOrNone, string> = {
  hard: "text-red-400 bg-red-400/10 border-red-400/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  easy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  none: "text-muted-foreground italic",
};

const ENJOYMENT_STYLES: Record<EnjoymentOrNone, string> = {
  low: "text-red-400 bg-red-400/10 border-red-400/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  high: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  none: "text-muted-foreground italic",
};

const TIME_STYLES: Record<TimeOrNone, string> = {
  high: "text-red-400 bg-red-400/10 border-red-400/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  none: "text-muted-foreground italic",
};

const DEFAULT_STYLE = "text-slate-400";

export const getPriorityStyle = (level: Priority | null | undefined): string =>
  level ? (PRIORITY_STYLES[level] ?? DEFAULT_STYLE) : DEFAULT_STYLE;

export const getEaseStyle = (level: Ease | null | undefined): string =>
  level ? (EASE_STYLES[level] ?? DEFAULT_STYLE) : DEFAULT_STYLE;

export const getEnjoymentStyle = (
  level: Enjoyment | null | undefined,
): string =>
  level ? (ENJOYMENT_STYLES[level] ?? DEFAULT_STYLE) : DEFAULT_STYLE;

export const getTimeStyle = (level: Time | null | undefined): string =>
  level ? (TIME_STYLES[level] ?? DEFAULT_STYLE) : DEFAULT_STYLE;

type TaksSortFieldMap = {
  priority: Priority;
  ease: Ease;
  enjoyment: Enjoyment;
  time: Time;
};

export const getAttributeStyle = <Field extends TaskSortField>(
  field: Field,
  value: TaksSortFieldMap[Field] | null | undefined,
): string => {
  switch (field) {
    case "priority":
      return getPriorityStyle(value as Priority);
    case "ease":
      return getEaseStyle(value as Ease);
    case "enjoyment":
      return getEnjoymentStyle(value as Enjoyment);
    case "time":
      return getTimeStyle(value as Time);
    default:
      return DEFAULT_STYLE;
  }
};
