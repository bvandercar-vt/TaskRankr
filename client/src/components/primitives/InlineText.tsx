// biome-ignore lint/style/useFilenamingConvention: is fine

import { Link } from 'wouter'

import { cn } from '@/lib/utils'

const isExternalHref = (href: string) =>
  /^(https?:|mailto:|tel:|#)/.test(href)

const linkClassName = (className?: string) =>
  cn(
    'font-medium text-cyan-400 underline underline-offset-2 cursor-pointer hover:text-sky-400',
    className,
  )

export const InlineLink = ({
  children,
  className,
  href,
  ...rest
}: React.PropsWithChildren<
  { className?: string; href: string } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    'className' | 'href'
  >
>) =>
  isExternalHref(href) ? (
    <a
      href={href}
      className={linkClassName(className)}
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
    >
      {children}
    </a>
  ) : (
    <Link to={href} className={linkClassName(className)} {...rest}>
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
