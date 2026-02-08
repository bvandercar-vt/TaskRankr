import { Input } from '@/components/primitives/forms/Input'

type TimeInputProps = {
  hours: number
  minutes: number
  onHoursChange: (hours: number) => void
  onMinutesChange: (minutes: number) => void
  onBlur?: () => void
  className?: string
  testIdPrefix?: string
}

export const TimeInput = ({
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
  onBlur,
  className = 'w-16 h-8 text-center text-sm',
  testIdPrefix = 'input-time',
}: TimeInputProps) => (
  <div className="flex items-center gap-2">
    <div className="flex items-center gap-1">
      <Input
        type="number"
        min={0}
        value={hours}
        onChange={(e) =>
          onHoursChange(Math.max(0, Number.parseInt(e.target.value) || 0))
        }
        onBlur={onBlur}
        className={className}
        data-testid={`${testIdPrefix}-hours`}
      />
      <span className="text-xs text-muted-foreground">h</span>
    </div>
    <div className="flex items-center gap-1">
      <Input
        type="number"
        min={0}
        max={59}
        value={minutes}
        onChange={(e) =>
          onMinutesChange(
            Math.min(59, Math.max(0, Number.parseInt(e.target.value) || 0)),
          )
        }
        onBlur={onBlur}
        className={className}
        data-testid={`${testIdPrefix}-minutes`}
      />
      <span className="text-xs text-muted-foreground">m</span>
    </div>
  </div>
)
