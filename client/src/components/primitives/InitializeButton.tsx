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
      className={cn('text-lg px-8 w-full', className)}
      data-testid={testId}
      onClick={onClick}
    >
      {title}
    </Button>
  )

  return (
    <div className="flex flex-col items-center w-[220px]">
      {href ? (
        <Link href={href} className="w-full">
          {button}
        </Link>
      ) : (
        button
      )}
      <p className="text-xs text-muted-foreground mt-1.5 text-center">
        {caption}
      </p>
    </div>
  )
}
