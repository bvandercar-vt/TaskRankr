// biome-ignore lint/style/useFilenamingConvention: is fine

import { Link } from 'wouter'

import { cn } from '@/lib/utils'

export const InlineLink = ({
  children,
  className,
  href,
}: React.PropsWithChildren<{ className?: string; href: string }>) => (
  <Link to={href}>
    <span
      className={cn(
        'font-medium text-cyan-400 underline underline-offset-2 cursor-pointer hover:text-sky-400',
        className,
      )}
    >
      {children}
    </span>
  </Link>
)

export const InlineEmphasized = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => (
  <strong className={cn('font-medium text-slate-300', className)}>
    {children}
  </strong>
)
