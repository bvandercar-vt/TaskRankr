// biome-ignore lint/style/useFilenamingConvention: is fine

import type { SetRequired } from 'type-fest'

import { cn } from '@/lib/utils'
import { Link } from './Link'

export const InlineLink = ({
  children,
  className,
  href,
  ...rest
}: React.PropsWithChildren<
  SetRequired<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>
>) => (
  <Link
    href={href}
    className={cn(
      'font-medium text-cyan-400 underline underline-offset-2 cursor-pointer hover:text-sky-400',
      className,
    )}
    {...rest}
  >
    {children}
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
