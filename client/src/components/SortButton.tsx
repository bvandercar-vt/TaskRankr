import { cn } from '@/lib/utils'
import type { SortOption } from '~/shared/schema'
import { Button } from './primitives/Button'

export const SortButton = ({
  label,
  value,
  className,
  current,
  onSelect,
}: {
  label: string
  value: SortOption
  className?: string
  current: SortOption
  onSelect: (v: SortOption) => void
}) => (
  <Button
    variant={current === value ? 'default' : 'ghost'}
    size="sm"
    onClick={() => onSelect(value)}
    className={cn(
      'h-8 p-0 text-[10px] font-bold uppercase tracking-wider transition-all rounded-md no-default-hover-elevate no-default-active-elevate',
      current === value
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
      className,
    )}
    data-testid={`button-sort-${value}`}
  >
    {label}
  </Button>
)
