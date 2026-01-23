import type { Priority, Ease, Enjoyment, Time } from "@shared/schema";

type PriorityOrNone = Priority | "none";
type EaseOrNone = Ease | "none";
type EnjoymentOrNone = Enjoyment | "none";
type TimeOrNone = Time | "none";

export const PRIORITY_STYLES: Record<PriorityOrNone, string> = {
  highest: "text-red-700 bg-red-400/10 border-red-500/20",
  high: "text-red-400 bg-red-400/10 border-red-500/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  lowest: "text-emerald-600/60 bg-emerald-600/5 border-emerald-600/10",
  none: "text-muted-foreground italic",
};

export const EASE_STYLES: Record<EaseOrNone, string> = {
  hard: "text-red-400 bg-red-400/10 border-red-400/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  easy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  none: "text-muted-foreground italic",
};

export const ENJOYMENT_STYLES: Record<EnjoymentOrNone, string> = {
  low: "text-red-400 bg-red-400/10 border-red-400/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  high: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  none: "text-muted-foreground italic",
};

export const TIME_STYLES: Record<TimeOrNone, string> = {
  high: "text-red-400 bg-red-400/10 border-red-400/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  none: "text-muted-foreground italic",
};

const DEFAULT_STYLE = "text-slate-400";

export const getPriorityStyle = (level: Priority | null | undefined): string =>
  level ? PRIORITY_STYLES[level] : DEFAULT_STYLE;

export const getEaseStyle = (level: Ease | null | undefined): string =>
  level ? EASE_STYLES[level] : DEFAULT_STYLE;

export const getEnjoymentStyle = (level: Enjoyment | null | undefined): string =>
  level ? ENJOYMENT_STYLES[level] : DEFAULT_STYLE;

export const getTimeStyle = (level: Time | null | undefined): string =>
  level ? TIME_STYLES[level] : DEFAULT_STYLE;

export const getAttributeStyle = (
  field: "priority" | "ease" | "enjoyment" | "time",
  value: string | null | undefined,
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
