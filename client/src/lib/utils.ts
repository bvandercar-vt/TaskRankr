import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const hoursMinutesToMs = (hours: number, minutes: number): number =>
  (hours * 3600 + minutes * 60) * 1000

export const msToHoursMinutes = (
  ms: number,
): { hours: number; minutes: number } => {
  const totalMinutes = Math.floor(ms / 60_000)
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  }
}
