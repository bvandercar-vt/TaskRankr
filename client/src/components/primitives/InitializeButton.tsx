import type { VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { Button, type buttonVariants } from './Button'
import { Link } from './Link'

type InitializeButtonProps = {
  title: string
  caption: string
  href?: string
  onClick?: () => void
  variant?: VariantProps<typeof buttonVariants>['variant']
  className?: string
  'data-testid'?: string
}

export const InitializeButton = ({
  title,
  caption,
  href,
  onClick,
  variant = 'default',
  className,
  'data-testid': testId,
}: InitializeButtonProps) => {
  const button = (
    <Button
      size="lg"
      variant={variant}
      className={cn(
        'text-lg px-8 w-full h-full py-2 flex-col gap-0 whitespace-normal justify-start',
        className,
      )}
      data-testid={testId}
      onClick={onClick}
    >
      <span>{title}</span>
      <span className="text-xs text-muted-foreground font-normal">
        {caption}
      </span>
    </Button>
  )

  return href ? (
    <Link href={href} className="w-[220px]">
      {button}
    </Link>
  ) : (
    <div className="w-[220px]">{button}</div>
  )
}
