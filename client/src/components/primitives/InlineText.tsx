// biome-ignore lint/style/useFilenamingConvention: is fine

import { Link } from 'wouter'

import { cn } from '@/lib/utils'

export const InlineLink = ({
  children,
  className,
  href,
}: React.PropsWithChildren<{ className?: string; href: string }>) => (
  <Link to={href}>
    <span className={cn('font-medium text-purple-300', className)}>
      {children}
    </span>
  </Link>
)

export const InlineEmphasized = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => (
  <span className={cn('font-medium text-teal-300', className)}>{children}</span>
)
