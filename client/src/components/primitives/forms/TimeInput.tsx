import { Input } from './Input'

const MS_PER_MINUTE = 60 * 1000
const MINUTES_PER_HOUR = 60
const MS_PER_HOUR = MS_PER_MINUTE * MINUTES_PER_HOUR
const MAX_MINUTES = MINUTES_PER_HOUR - 1

const getDurationMs = (hours: number, minutes: number) =>
  hours * MS_PER_HOUR + minutes * MS_PER_MINUTE

type TimeInputProps = {
  durationMs: number
  onDurationChange: (durationMs: number) => void
  onBlur?: () => void
  className?: string
  'data-testid'?: string
}

export const TimeInput = ({
  durationMs,
  onDurationChange,
  onBlur,
  className = 'w-16 h-8 text-center text-sm',
  'data-testid': testId = 'time-input',
}: TimeInputProps) => {
  const hours = Math.floor(durationMs / MS_PER_HOUR)
  const minutes = Math.floor((durationMs % MS_PER_HOUR) / MS_PER_MINUTE)

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target
    requestAnimationFrame(() => {
      input.select()
    })
  }

  return (
    <div className="flex items-center gap-2" data-testid={testId}>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          step={0.01}
          value={Number(hours).toString()}
          onChange={(e) => {
            const value = Math.max(0, Number.parseFloat(e.target.value) || 0)
            const h = Math.floor(value)
            const fractionalHours = value - h
            const m = Math.round(fractionalHours * MINUTES_PER_HOUR)
            onDurationChange(getDurationMs(h, m))
          }}
          onFocus={handleFocus}
          onBlur={onBlur}
          className={className}
          data-testid={`${testId}-hours`}
        />
        <span className="text-xs text-muted-foreground">h</span>
      </div>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          max={MAX_MINUTES}
          step={1}
          value={Number(minutes).toString()}
          onChange={(e) => {
            const m = Math.min(
              MAX_MINUTES,
              Math.max(0, Number.parseInt(e.target.value) || 0),
            )
            onDurationChange(getDurationMs(hours, m))
          }}
          onFocus={handleFocus}
          onBlur={onBlur}
          className={className}
          data-testid={`${testId}-minutes`}
        />
        <span className="text-xs text-muted-foreground">m</span>
      </div>
    </div>
  )
}
