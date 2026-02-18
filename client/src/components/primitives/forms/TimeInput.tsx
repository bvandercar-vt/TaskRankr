import { Input } from './Input'

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
  const hours = Math.floor(durationMs / 3_600_000)
  const minutes = Math.floor((durationMs % 3_600_000) / 60_000)

  return (
    <div className="flex items-center gap-2" data-testid={testId}>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          value={hours}
          onChange={(e) => {
            const h = Math.max(0, Number.parseInt(e.target.value) || 0)
            onDurationChange(h * 3_600_000 + minutes * 60_000)
          }}
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
          max={59}
          value={minutes}
          onChange={(e) => {
            const m = Math.min(
              59,
              Math.max(0, Number.parseInt(e.target.value) || 0),
            )
            onDurationChange(hours * 3_600_000 + m * 60_000)
          }}
          onBlur={onBlur}
          className={className}
          data-testid={`${testId}-minutes`}
        />
        <span className="text-xs text-muted-foreground">m</span>
      </div>
    </div>
  )
}
