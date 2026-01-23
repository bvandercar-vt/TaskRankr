export const PRIORITY_STYLES: Record<string, string> = {
  highest: "text-red-700 bg-red-500/10 border-red-500/20",
  high: "text-red-400 bg-red-400/10 border-red-400/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  lowest: "text-emerald-600/60 bg-emerald-600/5 border-emerald-600/10",
  none: "text-muted-foreground italic",
};

export const EASE_STYLES: Record<string, string> = {
  hard: "text-red-400 bg-red-400/10 border-red-400/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  easy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  none: "text-muted-foreground italic",
};

export const ENJOYMENT_STYLES: Record<string, string> = {
  low: "text-red-400 bg-red-400/10 border-red-400/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  high: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  none: "text-muted-foreground italic",
};

export const TIME_STYLES: Record<string, string> = {
  high: "text-red-400 bg-red-400/10 border-red-400/20",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  none: "text-muted-foreground italic",
};

export const getPriorityStyle = (level: string | null | undefined): string =>
  PRIORITY_STYLES[level || ""] || "text-slate-400";

export const getEaseStyle = (level: string | null | undefined): string =>
  EASE_STYLES[level || ""] || "text-slate-400";

export const getEnjoymentStyle = (level: string | null | undefined): string =>
  ENJOYMENT_STYLES[level || ""] || "text-slate-400";

export const getTimeStyle = (level: string | null | undefined): string =>
  TIME_STYLES[level || ""] || "text-slate-400";

export const getAttributeStyle = (
  field: "priority" | "ease" | "enjoyment" | "time",
  value: string | null | undefined
): string => {
  switch (field) {
    case "priority":
      return getPriorityStyle(value);
    case "ease":
      return getEaseStyle(value);
    case "enjoyment":
      return getEnjoymentStyle(value);
    case "time":
      return getTimeStyle(value);
    default:
      return "text-slate-400";
  }
};
