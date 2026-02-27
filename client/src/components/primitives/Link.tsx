import type { SetRequired } from 'type-fest'
import { Link as WouterLink } from 'wouter'

const isExternalHref = (href: string) => /^(https?:|mailto:|tel:|#)/.test(href)
const isApiRef = (href: string) => href.startsWith('/api/')

export type LinkProps = SetRequired<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
> & {
  newTab?: boolean
}

export const Link = ({
  children,
  href,
  newTab = false,
  className,
}: LinkProps) =>
  isExternalHref(href) || isApiRef(href) ? (
    <a
      href={href}
      className={className}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ) : (
    <WouterLink to={href} className={className}>
      {children}
    </WouterLink>
  )
