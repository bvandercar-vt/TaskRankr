/**
 * @fileoverview Card with a circular icon/number and title + description.
 */

import { Card, CardContent } from '@/components/primitives/Card'
import { cn } from '@/lib/utils'

export interface IconCardProps {
  icon: React.ReactNode
  title: React.ReactNode
  titleRightIcon?: React.ReactNode
  'data-testid'?: string
  description: React.ReactNode
  small?: boolean
  className?: string
}

export const IconCard = ({
  icon,
  title,
  titleRightIcon,
  description,
  'data-testid': testId,
  small,
  className,
}: IconCardProps) => (
  <Card
    className={cn('bg-card/50 border-white/10', className)}
    data-testid={testId}
  >
    <CardContent className="p-4 flex items-start gap-4">
      <div
        className={cn(
          'shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary',
          small ? 'w-8 h-8 text-sm font-bold' : 'w-10 h-10',
        )}
      >
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-foreground mb-1 flex items-center gap-1">
          {title}
          {titleRightIcon}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
)
