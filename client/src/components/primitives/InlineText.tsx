// biome-ignore lint/style/useFilenamingConvention: is fine

import type { MergeExclusive, SetRequired } from 'type-fest'

import { cn } from '@/lib/utils'
import { Link, type LinkProps } from './Link'

const inlineLinkClass =
  'font-medium text-cyan-400 underline underline-offset-2 cursor-pointer hover:text-sky-400'

export const InlineLink = ({
  children,
  className,
  href,
  ...rest
}: React.PropsWithChildren<
  MergeExclusive<
    SetRequired<LinkProps, 'href'>,
    SetRequired<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>
  >
>) =>
  href ? (
    <Link
      {...(rest as LinkProps)}
      className={cn(inlineLinkClass, className)}
      href={href}
    >
      {children}
    </Link>
  ) : (
    <button
      type="button"
      className={cn(inlineLinkClass, className)}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  )

export const InlineEmphasized = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => (
  <strong className={cn('font-medium text-slate-300', className)}>
    {children}
  </strong>
)
